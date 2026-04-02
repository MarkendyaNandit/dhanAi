import React, { useState, useEffect } from 'react';
import { fetchForecast } from '../api';
import AIInsight from '../components/AIInsight';

const Forecast = ({ data, currency = 'USD' }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (data && data._id) {
        setLoading(true);
        fetchForecast(data._id, data.transactions, data.totalIncome, data.totalExpense)
            .then(res => setForecast(res))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }
  }, [data]);

  if (!data) {
      return (
          <div className="glass-card flex-col items-center justify-center p-8" style={{ minHeight: '400px', textAlign: 'center' }}>
             <h3>No Data Available</h3>
             <p style={{ color: 'var(--text-secondary)' }}>Please upload a statement on the Dashboard first.</p>
          </div>
      );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val || 0);
  };

  return (
    <div className="animation-fade-in">
        <div className="app-header" style={{ padding: '0 0 2rem' }}>
            <h2>AI Spending Forecast</h2>
            <p>Predictive analysis for next month based on your history.</p>
        </div>

        {loading && (
            <div className="loader-container">
                <div className="spinner"></div>
                <p>Generating forecast...</p>
            </div>
        )}

        {error && (
            <div className="glass-card" style={{ border: '1px solid var(--danger)', background: 'var(--danger-bg)' }}>
                <p style={{ color: 'var(--danger)' }}>{error}</p>
            </div>
        )}

        {forecast && !loading && (
            <div className="grid gap-6">
                <AIInsight 
                  title="Forecast Analysis" 
                  insight={forecast.overview} 
                  color="var(--accent-secondary)"
                />
                
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="glass-card stat-card">
                       <span className="stat-label">Predicted Spends</span>
                       <span className="stat-value expense">{formatCurrency(forecast.predictedExpense)}</span>
                    </div>
                    <div className="glass-card stat-card">
                       <span className="stat-label">Predicted Savings</span>
                       <span className="stat-value income">{formatCurrency(forecast.predictedSavings)}</span>
                    </div>
                </div>

                <div className="glass-card">
                    <h3 className="section-title">Category Breakdown</h3>
                    <div className="transactions-container">
                        {forecast.categories?.map((cat, idx) => (
                            <div key={idx} className="transaction-item">
                                <span className="transaction-desc">{cat.name}</span>
                                <span className="transaction-amount expense">{formatCurrency(cat.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Forecast;
