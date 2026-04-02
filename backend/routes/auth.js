import express from 'express';

const router = express.Router();

import User from '../models/User.js';
import { sendEmailOTP } from '../services/mailService.js';
import { sendSMSOTP } from '../services/smsService.js';
import { startUserEmailListener } from '../services/emailListener.js';
import { OAuth2Client } from 'google-auth-library';

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5173/auth/google/callback'
);

// In-memory OTP store (email -> {phone_code, email_code})
const otps = {};

// Optional: Seed demo users if they don't exist
const seedDemoUsers = async () => {
    try {
        const demoUsers = [
            { email: 'user@example.com', password: 'password', name: 'Premium User', phone: '1234567890' },
            { email: 'admin@smartfinance.ai', password: 'admin123', name: 'System Admin', phone: '0987654321' }
        ];
        for (const u of demoUsers) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
                console.log(`[SEED] Created demo user: ${u.email}`);
            }
        }
    } catch (err) {
        console.error('[SEED] Error seeding users:', err);
    }
};
seedDemoUsers();

router.post('/send-otp', async (req, res) => {
    const { email, phone } = req.body;
    if (!email || !phone) return res.status(400).json({ error: 'Email and phone required' });

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = { code, phone, expires: Date.now() + 600000 };

    console.log(`[AUTH] Sent OTP ${code} to Email: ${email} and Phone: ${phone}`);

    // Attempt real delivery
    const mailResult = await sendEmailOTP(email, code);
    await sendSMSOTP(phone, code);

    res.json({
        message: `OTP sent successfully. Check your email ${mailResult.previewUrl ? '(Preview link in console)' : ''}`,
        previewUrl: mailResult.previewUrl
    });
});

router.post('/verify-otp', (req, res) => {
    const { email, code } = req.body;
    const record = otps[email];

    if (!record || record.code !== code || record.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    delete otps[email];
    res.json({ message: 'OTP verified successfully' });
});

router.post('/register', async (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !phone) return res.status(400).json({ error: 'Email, password, and phone required' });

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newUser = await User.create({ email, password, name: name || 'Valued User', phone });

        // Return imapPassword explicitly for frontend if needed
        res.json({ message: 'Registration successful', user: { _id: newUser._id, email: newUser.email, name: newUser.name, phone: newUser.phone, accNo: newUser.accNo, imapPassword: newUser.imapPassword || '' } });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Trigger Sync Listener asynchronously
        if (user.imapPassword) {
            startUserEmailListener(user);
        }

        res.json({ message: 'Login successful', user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, accNo: user.accNo, password: user.password, imapPassword: user.imapPassword || '' } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

router.post('/update-profile', async (req, res) => {
    const { userId, ...updates } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        // If imapPassword was updated, restart the listener
        if (updates.imapPassword) {
            startUserEmailListener(updatedUser);
        }

        res.json({
            message: 'Profile updated successfully',
            user: { _id: updatedUser._id, email: updatedUser.email, name: updatedUser.name, phone: updatedUser.phone, accNo: updatedUser.accNo, password: updatedUser.password, imapPassword: updatedUser.imapPassword || '' }
        });
    } catch (err) {
        res.status(500).json({ error: 'Update failed', details: err.message });
    }
});

router.get('/google/url', (req, res) => {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://mail.google.com/'],
        prompt: 'consent'
    });
    res.json({ url: authorizeUrl });
});

router.post('/google/callback', async (req, res) => {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'Code and User ID required' });

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        const updatedUser = await User.findByIdAndUpdate(userId, { googleRefreshToken: tokens.refresh_token }, { new: true });
        
        startUserEmailListener(updatedUser);

        res.json({ message: 'Gmail linked successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: 'Failed to exchange token', details: err.message });
    }
});

export default router;
