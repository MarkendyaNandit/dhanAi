import express from 'express';
import { chatWithAI } from '../services/aiService.js';
import Statement from '../models/Statement.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message, statementId, context: directContext } = req.body;
        
        if (!message) {
             return res.status(400).json({ error: 'Message is required' });
        }

        let context = null;
        if (statementId) {
             context = await Statement.findById(statementId);
        }

        // Fallback for ad-hoc context
        if (!context && directContext) {
            context = directContext;
        }

        const reply = await chatWithAI(message, context);
        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message', details: error.message });
    }
});

export default router;
