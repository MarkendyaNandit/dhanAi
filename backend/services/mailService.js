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

/**
 * Send Spending Alert via Email
 */
export const sendSpendingAlert = async (email, data) => {
    try {
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: `"DhanAi Notifications" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "⚠️ Spending Alert: Threshold Exceeded",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; background: #fafafa; border-radius: 12px; border: 1px solid #eee;">
                    <h2 style="color: #ef4444;">Threshold Exceeded</h2>
                    <p>Alert! Your recent spending has exceeded your set threshold.</p>
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Recent Transaction:</strong> ${data.description}</p>
                        <p><strong>Amount:</strong> ${data.amount}</p>
                        <p><strong>Total Period Spending:</strong> ${data.totalSpending}</p>
                        <p><strong>Your Threshold:</strong> ${data.threshold}</p>
                    </div>
                    <p style="font-size: 0.9rem; color: #666;">You can manage your alert preferences in the DhanAi settings.</p>
                </div>
            `,
        });
        console.log(`[MAIL] Spending alert sent to ${email}`);
    } catch (error) {
        console.error(`[MAIL-ERROR] Failed to send spending alert: ${error.message}`);
    }
};

/**
 * Send Weekly Summary via Email
 */
export const sendWeeklySummary = async (email, summary) => {
    try {
        const transporter = await getTransporter();
        await transporter.sendMail({
            from: `"DhanAi Weekly Reports" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `📊 Your Financial Weekly Summary`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; background: #fafafa; border-radius: 12px;">
                    <h2 style="color: #6366f1;">Weekly Summary</h2>
                    <p>Here is your financial overview for the past week:</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #10b981;">
                            <p style="margin: 0; color: #065f46; font-size: 0.8rem;">TOTAL INCOME</p>
                            <h3 style="margin: 5px 0; color: #059669;">${summary.totalIncome}</h3>
                        </div>
                        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #ef4444;">
                            <p style="margin: 0; color: #991b1b; font-size: 0.8rem;">TOTAL EXPENSES</p>
                            <h3 style="margin: 5px 0; color: #dc2626;">${summary.totalExpense}</h3>
                        </div>
                    </div>

                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;">
                        <h4 style="margin-top: 0;">Top Sending Categories:</h4>
                        ${summary.topCategories.map(c => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                <span>${c.name}</span>
                                <span style="font-weight: 600;">${c.amount}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
                        <h4 style="margin: 0; color: #92400e;">💡 AI Insight</h4>
                        <p style="margin: 8px 0 0; font-size: 0.9rem; color: #78350f; line-height: 1.4;">${summary.insight}</p>
                    </div>

                    <p style="font-size: 0.8rem; color: #999; margin-top: 25px; text-align: center;">
                        Thank you for using DhanAi. Stay smart with your money!
                    </p>
                </div>
            `,
        });
        console.log(`[MAIL] Weekly summary sent to ${email}`);
    } catch (error) {
        console.error(`[MAIL-ERROR] Failed to send weekly summary: ${error.message}`);
    }
};
