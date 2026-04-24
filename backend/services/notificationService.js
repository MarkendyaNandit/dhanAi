import cron from 'node-cron';
import User from '../models/User.js';
import Statement from '../models/Statement.js';
import { sendSpendingAlert, sendWeeklySummary } from './mailService.js';
import { generateConsolidatedOverview } from './aiService.js';

/**
 * Check if the user has exceeded their spending threshold
 * This should be called after new transactions are added.
 */
export const checkSpendingAlert = async (userId, newTransactions) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.emailNotifications) return;

        // Get the most recent statement to calculate current total period spending
        const latestStatement = await Statement.findOne({ userId }).sort({ uploadDate: -1 });
        if (!latestStatement) return;

        const totalSpending = latestStatement.totalExpense;
        const threshold = user.spendingThreshold || 5000;

        // Check if ANY of the NEW transactions triggered the alert, or if the total now exceeds threshold
        // We only send the alert ONCE per threshold breach (to avoid spamming)
        if (totalSpending > threshold && !latestStatement.isAlertSent) {
            // Find the transaction that likely tipped it over, or just the largest new one
            const largestNewTransaction = [...newTransactions]
                .filter(t => t.type === 'expense')
                .sort((a, b) => b.amount - a.amount)[0];

            if (largestNewTransaction) {
                await sendSpendingAlert(user.email, {
                    description: largestNewTransaction.description,
                    amount: largestNewTransaction.amount,
                    totalSpending: totalSpending,
                    threshold: threshold
                });

                // Mark as sent to prevent duplicate alerts for this statement
                latestStatement.isAlertSent = true;
                await latestStatement.save();
            }
        }
    } catch (err) {
        console.error('[NOTIF-SERVICE] Error checking spending alert:', err);
    }
};

/**
 * Weekly Summary Task Logic
 * Runs for all users who have the feature enabled.
 */
export const runWeeklySummaries = async () => {
    console.log('[NOTIF-SERVICE] Starting weekly summary generation...');
    try {
        const users = await User.find({ weeklySummary: true });
        
        for (const user of users) {
            // Get transactions for the past 7 days
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            // Fetch all statements for the user from last week
            const statements = await Statement.find({
                userId: user._id,
                uploadDate: { $gte: lastWeek }
            });

            if (statements.length === 0) {
                console.log(`[NOTIF-SERVICE] No data for user ${user.email} this week.`);
                continue;
            }

            // Aggregate all transactions from these statements
            let allTransactions = [];
            let totalIncome = 0;
            let totalExpense = 0;

            statements.forEach(s => {
                allTransactions = [...allTransactions, ...s.transactions];
                totalIncome += s.totalIncome;
                totalExpense += s.totalExpense;
            });

            // Get Top 3 Categories
            const categories = {};
            allTransactions.filter(t => t.type === 'expense').forEach(t => {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            });

            const topCategories = Object.entries(categories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, amount]) => ({ name, amount }));

            // Generate AI Insight for the week
            const { overview } = await generateConsolidatedOverview(allTransactions, totalIncome, totalExpense);

            await sendWeeklySummary(user.email, {
                totalIncome,
                totalExpense,
                topCategories,
                insight: overview
            });
        }
    } catch (err) {
        console.error('[NOTIF-SERVICE] Error in weekly summary task:', err);
    }
};

/**
 * Initialize Cron Jobs
 */
export const initNotificationService = () => {
    // Schedule: Sunday 9:00 AM
    // Seconds Minutes Hours DayOfMonth Month DayOfWeek
    // 0 0 9 * * 0
    cron.schedule('0 0 9 * * 0', () => {
        runWeeklySummaries();
    });

    console.log('[NOTIF-SERVICE] Weekly summary task scheduled (Sunday 9 AM)');
};
