import mongoose from 'mongoose';

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
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
