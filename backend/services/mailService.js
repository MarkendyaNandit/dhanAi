import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
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
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
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
            from: '"SmartFinance AI" <no-reply@smartfinance.ai>',
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
        console.error('[MAIL] Error sending email, falling back to console log:', error.message);
        // Do not throw here, allow the flow to continue for development/debugging
        console.log(`[MAIL-FALLBACK-LOG] To: ${email} | Code: ${code}`);
        return { status: 'logged', error: error.message };
    }
};
