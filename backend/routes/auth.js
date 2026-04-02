import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { sendEmailOTP } from '../services/mailService.js';
import { sendSMSOTP } from '../services/smsService.js';
import { startUserEmailListener } from '../services/emailListener.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5173/auth/google/callback'
);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// Rate Limiter for Authentication (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `windowMs`
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// In-memory OTP store (email -> {phone_code, email_code})
const otps = {};

router.post('/send-otp', async (req, res) => {
    let { email, phone } = req.body;
    if (!email || !phone) return res.status(400).json({ error: 'Email and phone required' });
    email = email.toLowerCase().trim();

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps[email] = { code, phone, expires: Date.now() + 600000 };

    console.log(`[AUTH] Sent OTP ${code} to Email: ${email} and Phone: ${phone}`);

    // Attempt real delivery
    const mailResult = await sendEmailOTP(email, code);
    await sendSMSOTP(phone, code);

    res.json({
        message: `OTP sent successfully. Check your email ${mailResult?.previewUrl ? '(Preview link in console)' : ''}`,
        previewUrl: mailResult?.previewUrl
    });
});

router.post('/verify-otp', (req, res) => {
    let { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
    email = email.toLowerCase().trim();
    
    // We do NOT delete the OTP here anymore because if the subsequent register fails 
    // (e.g. password too short, user exists, rate limited), the user would be forced 
    // to request a new OTP to try again.
    const record = otps[email];

    if (!record || record.code !== code || record.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
});

router.post('/register', authLimiter, async (req, res) => {
    let { email, password, name, phone } = req.body;
    if (!email || !password || !phone) return res.status(400).json({ error: 'Email, password, and phone required' });
    email = email.toLowerCase().trim();

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newUser = await User.create({ email, password, name: name || 'Valued User', phone });
        
        // Clean up OTP to prevent reuse
        delete otps[email];

        // Generate JWT
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            message: 'Registration successful', 
            token, // Return token here
            user: { _id: newUser._id, email: newUser.email, name: newUser.name, phone: newUser.phone, accNo: newUser.accNo, imapPassword: newUser.imapPassword || '' } 
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    email = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        // Trigger Sync Listener asynchronously
        if (user.imapPassword) {
            startUserEmailListener(user);
        }

        res.json({ 
            message: 'Login successful', 
            token, // <-- Inject JWT
            user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, accNo: user.accNo, imapPassword: user.imapPassword || '' } 
        });
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
