import express from 'express';
import multer from 'multer';
import { analyzeStatementData, parseRawMessages, generateConsolidatedOverview } from '../services/aiService.js';
import Statement from '../models/Statement.js';

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

    // Save to MongoDB
    const newStatement = await Statement.create({
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

    const statements = await Statement.find({ userId }).sort({ uploadDate: -1 });
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
    const statement = await Statement.findById(req.params.id);
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
        const statement = await Statement.findOne({ userId }).sort({ uploadDate: -1 });
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

        await statement.save();

        res.json({ message: 'Transaction added', transaction: newTransaction, statementId: statement._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/update-overview', async (req, res) => {
  try {
    const { transactions, totalIncome, totalExpense } = req.body;
    if (!transactions) return res.status(400).json({ error: 'Transactions required' });

    const { overview, essentials } = await generateConsolidatedOverview(transactions, totalIncome, totalExpense);
    res.json({ overview, essentials });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
