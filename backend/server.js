import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import analyzeRoutes from './routes/analyze.js';
import chatRoutes from './routes/chat.js';
import forecastRoutes from './routes/forecast.js';
import authRoutes from './routes/auth.js';
import { startUserEmailListener } from './services/emailListener.js';
import User from './models/User.js';

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
import { protect } from './middleware/auth.js';

app.use('/api/analyze', protect, analyzeRoutes);
app.use('/api/chat', protect, chatRoutes);
app.use('/api/forecast', protect, forecastRoutes);
app.use('/api/auth', authRoutes);


// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('AI Bank Statement Analyzer API is running...');
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Start IMAP listeners for all users who have it configured
  try {
    const users = await User.find({ imapPassword: { $ne: '' } });
    for (const user of users) {
      startUserEmailListener(user);
    }
  } catch (err) {
    console.error('Error starting initial sync listeners:', err);
  }
});
