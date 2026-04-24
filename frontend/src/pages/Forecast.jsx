import React, { useState, useEffect, useMemo } from 'react';
import { fetchForecast } from '../api';
import AIInsight from '../components/AIInsight';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

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

    // ── Monthly spending trend data for chart ──
    const trendData = useMemo(() => {
        if (!data?.transactions || data.transactions.length === 0) return [];

        // Group expenses by month
        const monthlyMap = {};
        data.transactions.filter(t => t.type === 'expense').forEach(t => {
            let month = 'Unknown';
            try {
                // Try to parse the date and get YYYY-MM
                const d = new Date(t.date);
                if (!isNaN(d.getTime())) {
                    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                }
            } catch (e) {
                // If date parsing fails, try extracting YYYY-MM directly
                if (t.date && t.date.length >= 7) month = t.date.substring(0, 7);
            }
            if (month !== 'Unknown') {
                monthlyMap[month] = (monthlyMap[month] || 0) + t.amount;
            }
        });

        const sortedMonths = Object.keys(monthlyMap).sort();
        if (sortedMonths.length === 0) return [];

        const historicalData = sortedMonths.map(m => ({
            month: formatMonthLabel(m),
            rawMonth: m,
            spending: convert ? convert(monthlyMap[m]) : monthlyMap[m],
            forecast: null
        }));

        // Predict next month using 3-month moving average
        const lastN = sortedMonths.slice(-3);
        const avgSpending = lastN.reduce((sum, m) => sum + monthlyMap[m], 0) / lastN.length;
        const forecastAmount = convert ? convert(avgSpending * 1.05) : avgSpending * 1.05;

        // Generate next month label
        const lastMonth = sortedMonths[sortedMonths.length - 1];
        const [yr, mo] = lastMonth.split('-').map(Number);
        const nextMo = mo === 12 ? 1 : mo + 1;
        const nextYr = mo === 12 ? yr + 1 : yr;
        const nextMonthKey = `${nextYr}-${String(nextMo).padStart(2, '0')}`;

        // Add a bridge point (last real data also shown on forecast line) for continuity
        const lastHistorical = historicalData[historicalData.length - 1];
        lastHistorical.forecast = lastHistorical.spending;

        historicalData.push({
            month: formatMonthLabel(nextMonthKey),
            rawMonth: nextMonthKey,
            spending: null,
            forecast: parseFloat(forecastAmount.toFixed(2))
        });

        return historicalData;
    }, [data, convert]);

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

    const chartFormatCurrency = (val) => {
        if (format) return format(val);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card" style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{label}</p>
                    {payload.map((entry, index) => (
                        entry.value != null && (
                            <p key={index} style={{ color: entry.color, fontSize: '0.85rem', margin: '2px 0' }}>
                                {entry.name === 'spending' ? 'Actual' : 'Forecast'}: {chartFormatCurrency(entry.value)}
                            </p>
                        )
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid gap-6">
            <AIInsight
                title="Forecast Analysis"
                insight={insightText}
                color="var(--accent-secondary)"
                format={format}
                convert={convert}
            />

            {/* Monthly Spending Trend Chart */}
            {trendData.length > 0 && (
                <div className="glass-card">
                    <h3 className="section-title">Monthly Spending Trend & Forecast</h3>
                    <div style={{ width: '100%', height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <XAxis
                                    dataKey="month"
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    axisLine={{ stroke: 'var(--border-color)' }}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    axisLine={{ stroke: 'var(--border-color)' }}
                                    tickFormatter={chartFormatCurrency}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => value === 'spending' ? 'Actual Spending' : 'Forecast'} />
                                {/* Solid line for actual spending */}
                                <Line
                                    type="monotone"
                                    dataKey="spending"
                                    stroke="var(--accent-primary)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--accent-primary)', r: 5, strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                                    activeDot={{ r: 7, fill: 'var(--accent-primary)' }}
                                    connectNulls={false}
                                    name="spending"
                                />
                                {/* Dashed line for forecast */}
                                <Line
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="var(--warning)"
                                    strokeWidth={3}
                                    strokeDasharray="8 4"
                                    dot={{ fill: 'var(--warning)', r: 6, strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                                    activeDot={{ r: 8, fill: 'var(--warning)' }}
                                    connectNulls={false}
                                    name="forecast"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

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

// Helper to format "2024-01" → "Jan 2024"
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatMonthLabel = (yyyymm) => {
    const [yr, mo] = yyyymm.split('-').map(Number);
    return `${MONTH_NAMES[mo - 1]} ${yr}`;
};

export default Forecast;
