import express from 'express';
import multer from 'multer';
import { analyzeStatementData, parseRawMessages, generateConsolidatedOverview } from '../services/aiService.js';
import Statement from '../models/Statement.js';
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('statement'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');

    // Call AI service to analyze the data
    const analysisResult = await analyzeStatementData(fileContent);

    // Verify mongoose connection state before any database write
    if (mongoose.connection.readyState !== 1) {
        console.warn(`[analyze.js:24] Mongoose connection state is ${mongoose.connection.readyState}. Attempting to reconnect...`);
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('[analyze.js:27] Successfully reconnected to MongoDB.');
        } catch (err) {
            console.error('[analyze.js:29] Failed to reconnect to MongoDB:', err);
            return res.status(500).json({ error: 'Database connection lost and failed to reconnect.' });
        }
    }

    let newStatement;
    try {
        console.log(`[analyze.js:36] Attempting to save new statement to MongoDB for user ${userId}...`);
        
        // Save to MongoDB
        newStatement = await Statement.create({
          userId,
          filename: req.file.originalname,
          uploadDate: new Date(),
          overview: analysisResult.overview,
          insights: analysisResult.insights,
          totalIncome: analysisResult.totalIncome,
          totalExpense: analysisResult.totalExpense,
          transactions: analysisResult.transactions,
          essentials: analysisResult.essentials
        });
        
        console.log(`[analyze.js:51] Successfully saved statement to MongoDB with ID ${newStatement._id}`);
    } catch (dbError) {
        console.error(`[analyze.js:53] MongoDB Write Error: ${dbError.message}`, dbError);
        
        // Catch EPIPE errors and reconnect automatically if the connection is closed.
        if ((dbError.message && dbError.message.includes('EPIPE')) || dbError.code === 'EPIPE') {
            console.warn('[analyze.js:57] Caught EPIPE error! The long-running Python analysis likely caused the MongoDB connection to drop. Attempting reconnect and retry...');
            try {
                // Force a reconnect
                await mongoose.disconnect();
                await mongoose.connect(process.env.MONGO_URI);
                
                console.log(`[analyze.js:63] Reconnected. Retrying statement save...`);
                newStatement = await Statement.create({
                  userId,
                  filename: req.file.originalname,
                  uploadDate: new Date(),
                  overview: analysisResult.overview,
                  insights: analysisResult.insights,
                  totalIncome: analysisResult.totalIncome,
                  totalExpense: analysisResult.totalExpense,
                  transactions: analysisResult.transactions,
                  essentials: analysisResult.essentials
                });
                console.log(`[analyze.js:75] Successfully saved statement on retry with ID ${newStatement._id}`);
            } catch (retryError) {
                console.error('[analyze.js:77] Retry failed:', retryError);
                return res.status(500).json({ error: 'Database connection dropped (EPIPE) and retry failed.', details: retryError.message });
            }
        } else {
            // Return a proper JSON error response instead of crashing with HTTP 500
            return res.status(500).json({ error: 'Database write failed', details: dbError.message });
        }
    }

    // Check for spending alerts
    import('../services/notificationService.js').then(m => m.checkSpendingAlert(userId, analysisResult.transactions));

    res.json({
      message: 'Analysis complete',
      data: newStatement
    });
  } catch (error) {
    console.error('Error during analysis:', error);
    res.status(500).json({ error: 'Failed to analyze statement', details: error.message });
  }
});

// Get previous statements for a specific user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    console.log(`[analyze.js:55] Fetching statements for user ${userId}...`);
    const statements = await Statement.find({ userId }).sort({ uploadDate: -1 });
    console.log(`[analyze.js:57] Fetched ${statements.length} statements.`);
    res.json(statements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statements' });
  }
});

// New Route: Sync check for transactions (called by frontend autoSync)
router.get('/sync', async (req, res) => {
    try {
        const userId = req.user.id; // From protect middleware
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Fetch user email for sync
        import('../models/User.js').then(async ({ default: User }) => {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const { triggerManualSync, activeConnections, startUserEmailListener } = await import('../services/emailListener.js');
            
            // Ensure connection is active
            if (!activeConnections.has(userId.toString())) {
                await startUserEmailListener(user);
            }

            const newTransactions = await triggerManualSync(userId, user.email);
            res.json({ 
                message: 'Sync complete', 
                newTransactions: newTransactions || [],
                count: newTransactions ? newTransactions.length : 0
            });
        }).catch(err => {
            console.error('Sync internal error:', err);
            res.status(500).json({ error: 'Sync failed during user lookup' });
        });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error during sync' });
    }
});

// New Route: Parse raw text/emails manually
router.post('/parse-text', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text required' });

        const result = await parseRawMessages(text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
  try {
    console.log(`[analyze.js:111] Fetching statement ${req.params.id}...`);
    const statement = await Statement.findById(req.params.id);
    console.log(`[analyze.js:113] Fetch result: ${statement ? 'Found' : 'Not found'}`);
    if (!statement) return res.status(404).json({ error: 'Not found' });
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statement' });
  }
});

router.post('/transaction', async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, description, category, date, type } = req.body;

        if (!userId || !amount || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find the most recent statement for this user
        console.log(`[analyze.js:129] Finding latest statement for user ${userId}...`);
        const statement = await Statement.findOne({ userId }).sort({ uploadDate: -1 });
        console.log(`[analyze.js:131] Find result: ${statement ? 'Found' : 'Not found'}`);
        if (!statement) {
            return res.status(404).json({ error: 'No statement found to append to. Please upload a statement first.' });
        }

        const newTransaction = {
            date,
            description: `[Manual] ${description}`,
            amount: parseFloat(amount),
            type,
            category: category || 'Other'
        };

        statement.transactions.push(newTransaction);
        
        if (type === 'income') {
            statement.totalIncome += newTransaction.amount;
        } else {
            statement.totalExpense += newTransaction.amount;
        }

        if (mongoose.connection.readyState !== 1) {
            console.warn(`[analyze.js:146] Mongoose connection state is ${mongoose.connection.readyState}. Reconnecting...`);
            try { await mongoose.connect(process.env.MONGO_URI); } catch (e) {}
        }

        try {
            console.log(`[analyze.js:151] Attempting to save updated transaction for statement ${statement._id}...`);
            await statement.save();
            console.log(`[analyze.js:153] Successfully saved updated transaction.`);
        } catch (dbError) {
            console.error(`[analyze.js:155] MongoDB Write Error: ${dbError.message}`);
            return res.status(500).json({ error: 'Database write failed', details: dbError.message });
        }

        res.json({ message: 'Transaction added', transaction: newTransaction, statementId: statement._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/update-overview', async (req, res) => {
    try {
      const { transactions, totalIncome, totalExpense, userId, persist } = req.body;
      if (!transactions) return res.status(400).json({ error: 'Transactions required' });
  
      // Re-run the python AI engine for the consolidated data
      const { overview, essentials, insights } = await generateConsolidatedOverview(transactions, totalIncome, totalExpense);
      
      let newStatement = null;
      if (persist && userId) {
          if (mongoose.connection.readyState !== 1) {
              console.warn(`[analyze.js:168] Mongoose connection state is ${mongoose.connection.readyState}. Attempting to reconnect...`);
              try { await mongoose.connect(process.env.MONGO_URI); } catch (e) {}
          }
          
          try {
              console.log(`[analyze.js:173] Attempting to save merged profile to MongoDB for user ${userId}...`);
              newStatement = await Statement.create({
                  userId,
                  filename: 'Merged Financial Profile',
                  uploadDate: new Date(),
                  overview,
                  insights,
                  essentials,
                  totalIncome,
                  totalExpense,
                  transactions
              });
              console.log(`[analyze.js:185] Successfully saved merged profile with ID ${newStatement._id}`);
          } catch (dbError) {
              console.error(`[analyze.js:187] MongoDB Write Error: ${dbError.message}`);
              if ((dbError.message && dbError.message.includes('EPIPE')) || dbError.code === 'EPIPE') {
                  console.warn('[analyze.js:189] Caught EPIPE error. Attempting reconnect and retry...');
                  try {
                      await mongoose.disconnect();
                      await mongoose.connect(process.env.MONGO_URI);
                      newStatement = await Statement.create({
                          userId,
                          filename: 'Merged Financial Profile',
                          uploadDate: new Date(),
                          overview,
                          insights,
                          essentials,
                          totalIncome,
                          totalExpense,
                          transactions
                      });
                      console.log(`[analyze.js:203] Successfully saved merged profile on retry.`);
                  } catch (retryError) {
                      return res.status(500).json({ error: 'Database retry failed', details: retryError.message });
                  }
              } else {
                  return res.status(500).json({ error: 'Database write failed', details: dbError.message });
              }
          }
      }
  
      res.json({ 
          overview, 
          essentials, 
          insights,
          data: newStatement
      });
    } catch (error) {
      console.error('Update Overview Error:', error);
      res.status(500).json({ error: error.message });
    }
});

export default router;
