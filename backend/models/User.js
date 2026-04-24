import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Valued User'
  },
  phone: {
    type: String,
    required: true
  },
  accNo: {
    type: String,
    default: () => `AI-BK-${Math.floor(10000000 + Math.random() * 90000000)}`
  },
  imapPassword: {
    type: String,
    default: ''
  },
  googleRefreshToken: {
    type: String,
    default: ''
  },
  // Notification Preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  weeklySummary: {
    type: Boolean,
    default: true
  },
  spendingThreshold: {
    type: Number,
    default: 5000
  },
  useForecastThreshold: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
