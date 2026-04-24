import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: String,
  description: String,
  amount: Number,
  type: {
    type: String,
    enum: ['income', 'expense']
  },
  category: String
});

const statementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: String,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  overview: String, // Keep for backward compatibility
  insights: {
    dashboard: String,
    transactions: String,
    forecast: String,
    goals: String
  },

  totalIncome: Number,
  totalExpense: Number,
  transactions: [transactionSchema],
  essentials: [{
    name: String,
    amount: Number,
    category: String
  }],
  isAlertSent: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Statement', statementSchema);
