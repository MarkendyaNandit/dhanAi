import React, { useState } from 'react';

const AIParser = ({ onAddTransactions }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const handleParse = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5001/api/analyze/parse-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to parse text');
            setParsedData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        // In a real app, this would merge into the global state
        // For now, we'll just show a success message
        alert('Successfully parsed ' + parsedData.transactions.length + ' transactions from your messages!');
        setParsedData(null);
        setText('');
    };

    return (
        <div className="animation-fade-in">
            <div className="app-header" style={{ padding: '0 0 2rem' }}>
                <h2>AI Message Parser</h2>
                <p>Paste bank SMS or Email contents to automatically extract transactions.</p>
            </div>

            <div className="grid gap-6">
                <div className="glass-card">
                    <h3 className="section-title">Paste Messages</h3>
                    <textarea 
                        className="glass-card" 
                        style={{ 
                            width: '100%', 
                            minHeight: '200px', 
                            padding: '1rem', 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            resize: 'vertical'
                        }}
                        placeholder="Paste SMS like: 'HDFC Bank: Rs. 500 spent at ZOMATO...'&#10;Or Email bank alerts..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button 
                        className="button button-primary" 
                        style={{ marginTop: '1.5rem', width: '200px' }}
                        disabled={loading || !text.trim()}
                        onClick={handleParse}
                    >
                        {loading ? 'AI Parsing...' : 'Extract Transactions'}
                    </button>
                </div>

                {error && (
                    <div className="glass-card" style={{ border: '1px solid var(--danger)', background: 'var(--danger-bg)' }}>
                        <p style={{ color: 'var(--danger)' }}>{error}</p>
                    </div>
                )}

                {parsedData && (
                    <div className="glass-card animation-slide-up">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Found Transactions</h3>
                            <button className="button button-primary" onClick={handleConfirm}>
                                Add to Dashboard
                            </button>
                        </div>
                        
                        <div className="transactions-container">
                            {parsedData.transactions.map((t, i) => (
                                <div key={i} className="transaction-item">
                                    <div className="flex-col">
                                        <span className="transaction-desc">{t.description}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.date} • {t.category}</span>
                                    </div>
                                    <span className={`transaction-amount ${t.type}`}>
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIParser;
