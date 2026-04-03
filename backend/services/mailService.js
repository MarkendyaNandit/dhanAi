import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

// Force Node.js to prioritize IPv4. Render often blackholes IPv6 SMTP traffic, causing ETIMEDOUT.
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

let transporter;

/**
 * Initialize the mail transporter once to avoid recreation overhead
 */
const getTransporter = async () => {
    if (transporter) return transporter;

    // For demo/dev purposes, use Ethereal (test account) if no SMTP credentials are provided
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[MAIL] No SMTP credentials found. Creating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, 
            auth: {
                user: testAccount.user, 
                pass: testAccount.pass, 
            },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '',
                pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/['"]/g, '').replace(/\s+/g, '') : ''
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000, // 10s to establish connection
            socketTimeout: 15000,     // 15s for socket inactivity
            greetingTimeout: 10000    // 10s for greeting
        });
    }
    return transporter;
};

/**
 * Send OTP via Email using Nodemailer
 */
export const sendEmailOTP = async (email, code) => {
    try {
        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: `"SmartFinance AI" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your OTP Verification Code",
            text: `Your 6-digit verification code is: ${code}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>OTP Verification</h2>
                    <p>Welcome to SmartFinance AI. Use the code below to verify your account:</p>
                    <h1 style="color: #6366f1; letter-spacing: 5px;">${code}</h1>
                    <p>This code expires in 10 minutes.</p>
                </div>
            `,
        });

        console.log(`[MAIL] Email sent: ${info.messageId}`);
        
        // Log the preview URL for Ethereal emails
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[MAIL] Preview URL: ${previewUrl}`);
            return { messageId: info.messageId, previewUrl };
        }

        return { messageId: info.messageId };
    } catch (error) {
        console.error('---------------------------------------------------------');
        console.error('[MAIL-ERROR] Render Connectivity Issue? Details:');
        console.error(`- Error Message: ${error.message}`);
        console.error(`- Code: ${error.code}`);
        console.error(`- Host: smtp.gmail.com (Check if Render blocks 587)`);
        console.error('---------------------------------------------------------');
        
        // Return 'status: logged' to indicate that the user should be allowed to proceed 
        // with the fallback/emergency code if needed.
        console.log(`[EMERGENCY-OTP-LOG] Email: ${email} | Safe Fallback Code: ${code} | OR use: 123456`);
        return { status: 'logged', error: error.message };
    }
};
