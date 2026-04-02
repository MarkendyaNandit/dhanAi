import express from 'express';
import { generateForecast } from '../services/aiService.js';
import Statement from '../models/Statement.js';

const router = express.Router();

const forecastCache = {};

router.post('/', async (req, res) => {
    try {
        const { statementId, transactions, totalIncome, totalExpense } = req.body;
        
        let context = null;
        if (statementId) {
             // Try cache first
             if (forecastCache[statementId]) {
                 return res.json(forecastCache[statementId]);
             }
             
             context = await Statement.findById(statementId);
        }

        // If not found in DB or no ID (e.g. ad-hoc), use the data passed from frontend
        if (!context && transactions) {
            context = { transactions, totalIncome, totalExpense };
        }

        const forecastData = await generateForecast(context);
        
        // Cache the successful result if we have an ID
        if (statementId) {
            forecastCache[statementId] = forecastData;
        }

        res.json(forecastData);
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ error: 'Failed to generate forecast', details: error.message });
    }
});

export default router;
