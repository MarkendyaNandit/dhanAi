import React, { useState, useMemo } from 'react';
import AIInsight from '../components/AIInsight';
import { Plus, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';

const Transactions = ({ data, currency = 'USD', convert, format, onAddTransaction }) => {
    const [filter, setFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');

    // Build rich insight text with JS fallback
    const insightText = useMemo(() => {
        if (!data || !data.transactions) return null;
        const backendInsight = data.insights?.transactions;
        if (backendInsight && backendInsight.length > 20) return backendInsight;

        // Compute from raw transactions
        const expenses = data.transactions.filter(t => t.type === 'expense');
        const incomes = data.transactions.filter(t => t.type === 'income');
        const categoryMap = {};
        expenses.forEach(t => {
            const cat = t.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
        });
        const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const topCat = sorted[0];
        
        const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
        const totalInc = incomes.reduce((s, t) => s + t.amount, 0);
        const top3 = sorted.slice(0, 3).map(([k, v]) => `${k} (${format(convert(v))})`).join(', ');

        return `You have ${data.transactions.length} total transactions — ${incomes.length} income & ${expenses.length} expenses. ` +
            (topCat ? `Top spending category: ${topCat[0]} at ${format(convert(topCat[1]))} (${totalExp > 0 ? ((topCat[1] / totalExp) * 100).toFixed(0) : 0}% of total spend). ` : '') +
            (top3 ? `Breakdown: ${top3}. ` : '') +
            (totalExp > totalInc * 0.8 ? '⚠️ High expense-to-income ratio — review recurring costs.' : '✅ Spending pattern looks healthy.');
    }, [data, format, convert]);

    if (!data || !data.transactions) {
        return (
            <div className="glass-card flex-col items-center justify-center p-8" style={{ minHeight: '400px', textAlign: 'center' }}>
                <h3>No Data Available</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Please upload a statement on the Dashboard first.</p>
            </div>
        );
    }

    const filtered = data.transactions
        .filter(tx => {
            if (filter === 'all') return true;
            return tx.type === filter;
        })
        .sort((a, b) => sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount);

    return (
        <div className="animation-fade-in">
            <div className="app-header flex items-center justify-between" style={{ padding: '0 0 2rem', textAlign: 'left' }}>
                <div>
                    <h2>All Transactions</h2>
                    <p>Detailed view of your financial records.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {['all', 'income', 'expense'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="btn"
                            style={{
                                padding: '0.5rem 1rem',
                                background: filter === f ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: filter === f ? 'white' : 'var(--text-secondary)',
                                textTransform: 'capitalize'
                            }}
                        >
                            {f}
                        </button>
                    ))}

                    {/* Sort Toggle */}
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
                    <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="btn"
                        title={sortOrder === 'desc' ? 'Sorted: Highest to Lowest' : 'Sorted: Lowest to Highest'}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        {sortOrder === 'desc' ? <ArrowDownWideNarrow size={16} /> : <ArrowUpNarrowWide size={16} />}
                        {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
                    </button>
                </div>
            </div>

            <AIInsight 
                title="Spending Habit Analysis" 
                insight={insightText} 
                color="var(--warning)"
                format={format}
                convert={convert}
            />

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((tx, idx) => (
                            <tr key={idx}>
                                <td style={{ color: 'var(--text-secondary)' }}>{tx.date}</td>
                                <td style={{ fontWeight: 500 }}>{tx.description}</td>
                                <td>
                                    <span className={`badge ${tx.type}`}>
                                        {tx.category}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }} className={tx.type}>
                                    {tx.type === 'income' ? '+' : '-'}{format(convert(tx.amount))}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No transactions found for this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Floating Action Button for Manual Entry */}
            <button 
                className="btn btn-primary" 
                onClick={onAddTransaction}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                    zIndex: 100,
                    padding: 0
                }}
                title="Add Transaction Manually"
            >
                <Plus size={30} />
            </button>
        </div>
    );
};

export default Transactions;
