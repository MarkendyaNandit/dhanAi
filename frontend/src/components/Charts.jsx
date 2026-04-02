import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Charts = ({ transactions, currency = 'USD' }) => {
  // Process transactions to group by category for the chart
  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Aggregate by category
    const aggregates = transactions.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { category: curr.category, Income: 0, Spending: 0 };
      }
      
      if (curr.type === 'income') {
        acc[curr.category].Income += curr.amount;
      } else {
        acc[curr.category].Spending += curr.amount;
      }
      
      return acc;
    }, {});

    return Object.values(aggregates);
  }, [transactions]);

  if (data.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data available for chart</div>;
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontSize: '0.9rem' }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis 
            dataKey="category" 
            stroke="var(--text-secondary)" 
            tick={{ fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis 
            stroke="var(--text-secondary)" 
            tick={{ fill: 'var(--text-secondary)' }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Income" fill="var(--success)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Spending" fill="var(--danger)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;
