import React, { useState, useEffect, useMemo } from 'react';
import { fetchForecast } from '../api';
import AIInsight from '../components/AIInsight';

const Forecast = ({ data, currency = 'USD', convert, format }) => {
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

  const formatValue = (val) => {
    if (format && convert) return format(convert(val));
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
            <ForecastContent
                forecast={forecast}
                data={data}
                formatCurrency={formatValue}
                format={format}
                convert={convert}
            />
        )}
    </div>
  );
};

// Separate component to cleanly use hooks
const ForecastContent = ({ forecast, data, formatCurrency, format, convert }) => {
    // Build category breakdown from backend data or fall back to raw transactions
    const categoryBreakdown = useMemo(() => {
        const cats = forecast?.categories;
        if (cats && cats.length > 0) return cats;

        // Fallback: compute from raw transactions
        if (!data?.transactions) return [];
        const map = {};
        data.transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'Other';
            map[cat] = (map[cat] || 0) + t.amount;
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount]) => ({ name, amount: parseFloat((amount * 1.05).toFixed(2)) }));
    }, [forecast, data]);

    const maxCategoryAmount = useMemo(
        () => categoryBreakdown.reduce((m, c) => Math.max(m, c.amount), 1),
        [categoryBreakdown]
    );

    // Derive a rich insight string from any available field
    const insightText = useMemo(() => {
        if (!forecast) return null;
        if (forecast.overview && forecast.overview.length > 30) return forecast.overview;
        if (forecast.insights?.forecast && forecast.insights.forecast.length > 10) return forecast.insights.forecast;

        // Build from numbers as last resort
        const top = categoryBreakdown[0];
        if (forecast.predictedExpense > 0) {
            return `📊 Next month forecast: ${formatCurrency(forecast.predictedExpense)} in expenses. ${top ? `Largest category: ${top.name} (${formatCurrency(top.amount)}).` : ''} Estimated savings: ${formatCurrency(Math.max(0, forecast.predictedSavings))}.`;
        }
        return 'Forecast analysis complete.';
    }, [forecast, categoryBreakdown, formatCurrency]);

    return (
        <div className="grid gap-6">
            <AIInsight
                title="Forecast Analysis"
                insight={insightText}
                color="var(--accent-secondary)"
                format={format}
                convert={convert}
            />

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="glass-card stat-card">
                    <span className="stat-label">Predicted Spends</span>
                    <span className="stat-value expense">{formatCurrency(forecast.predictedExpense)}</span>
                </div>
                <div className="glass-card stat-card">
                    <span className="stat-label">Predicted Savings</span>
                    <span className={`stat-value ${forecast.predictedSavings >= 0 ? 'income' : 'expense'}`}>
                        {formatCurrency(forecast.predictedSavings)}
                    </span>
                </div>
            </div>

            <div className="glass-card">
                <h3 className="section-title">Category Breakdown</h3>
                {categoryBreakdown.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>No expense categories found.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '0.75rem' }}>
                        {categoryBreakdown.map((cat, idx) => (
                            <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(cat.amount)}</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(100, (cat.amount / maxCategoryAmount) * 100).toFixed(1)}%`,
                                        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                                        borderRadius: '99px',
                                        transition: 'width 0.6s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forecast;
