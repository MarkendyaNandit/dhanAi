import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Send OTP via SMS using Twilio
 */
export const sendSMSOTP = async (phone, code) => {
    try {
        const sid = process.env.TWILIO_SID;
        const token = process.env.TWILIO_TOKEN;
        const from = process.env.TWILIO_PHONE;

        if (!sid || !token || !from) {
            console.warn('[SMS] Twilio credentials missing system-wide. Falling back to console log.');
            console.log(`[SMS-LOG] To Phone: ${phone} | Code: ${code}`);
            return { sid: 'mock-sid', status: 'logged' };
        }

        const client = twilio(sid, token);
        const message = await client.messages.create({
            body: `Your SmartFinance AI verification code is: ${code}`,
            from: from,
            to: phone
        });

        console.log(`[SMS] Message sent: ${message.sid}`);
        return { sid: message.sid, status: message.status };
    } catch (error) {
        console.error('[SMS] Error sending SMS:', error);
        // We don't throw here to avoid blocking the whole process if only SMS fails
        return { error: error.message };
    }
};
