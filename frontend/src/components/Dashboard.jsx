import AIInsight from './AIInsight';
import Charts from './Charts';
import { ArrowUpRight, ArrowDownRight, Activity, Plus } from 'lucide-react';

const Dashboard = ({ data, currency = 'USD', isSyncing = false, convert, format }) => {
  if (!data) return null;

  const { overview, insights, totalIncome, totalExpense, transactions } = data;

  const remaining = totalIncome - totalExpense;

  // Build a rich insight text with fallbacks
  const insightText = (() => {
    const dash = insights?.dashboard;
    if (dash && dash.length > 30) return dash;
    if (overview && overview.length > 30) return overview;
    // Compute from raw numbers
    if (totalIncome > 0 || totalExpense > 0) {
      const savingsRate = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(1) : 0;
      const topCat = transactions && transactions.length > 0
        ? Object.entries(
            transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
              const cat = t.category || 'Other';
              acc[cat] = (acc[cat] || 0) + t.amount;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1])[0]
        : null;
      
      return remaining >= 0
        ? `Savings rate: ${savingsRate}% — You have ${format(convert(remaining))} surplus this period.${topCat ? ` Top spending category: ${topCat[0]} (${format(convert(topCat[1]))}).` : ''} Keep it up!`
        : `⚠️ Overspending: Expenses exceed income by ${format(convert(Math.abs(remaining)))}.${topCat ? ` Largest cost: ${topCat[0]} (${format(convert(topCat[1]))}).` : ''} Review non-essentials.`;
    }
    return null;
  })();

  return (
    <div style={{ animation: 'fadeInUp 0.8s ease-out' }}>
      
      {isSyncing && (
          <div className="glass-card" style={{ 
              marginBottom: '1.5rem', 
              padding: '0.8rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              borderLeft: '4px solid var(--accent-primary)',
              background: 'rgba(99, 102, 241, 0.05)'
          }}>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Scanning bank emails and SMS for new transactions...
              </span>
          </div>
      )}
      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="flex items-center justify-between">
             <span className="stat-label">Total Income</span>
             <ArrowUpRight color="var(--success)" size={24} />
          </div>
          <span className="stat-value income">{format(convert(totalIncome))}</span>
        </div>
        
        <div className="glass-card stat-card">
          <div className="flex items-center justify-between">
             <span className="stat-label">Total Spends</span>
             <ArrowDownRight color="var(--danger)" size={24} />
          </div>
          <span className="stat-value expense">{format(convert(totalExpense))}</span>
        </div>

        <div className="glass-card stat-card">
          <div className="flex items-center justify-between">
             <span className="stat-label">Net Remaining</span>
             <Activity color="var(--accent-primary)" size={24} />
          </div>
          <span className={`stat-value ${remaining >= 0 ? 'income' : 'expense'}`}>
            {format(convert(remaining))}
          </span>
        </div>
      </div>

      <div className="main-content">
        {/* Left Column: Chart & Overview */}
        <div className="flex-col gap-6">
          <div className="glass-card">
            <h3 className="section-title">Income vs Spendings</h3>
            <Charts transactions={transactions || []} currency={currency} convert={convert} format={format} />
          </div>

          <AIInsight 
            title="Financial Health Overview" 
            insight={insightText} 
            format={format}
            convert={convert}
          />
        </div>

        {/* Right Column: Transactions List */}
        <div className="glass-card">
           <h3 className="section-title">Recent Transactions</h3>
           <div className="transactions-container">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx, idx) => (
                  <div key={idx} className="transaction-item">
                    <div className="transaction-info">
                      <span className="transaction-desc">{tx.description}</span>
                      <div className="transaction-meta">
                        <span>{tx.date}</span>
                        <span className={`badge ${tx.type === 'income' ? 'income' : 'expense'}`}>
                          {tx.category}
                        </span>
                      </div>
                    </div>
                    <div className={`transaction-amount ${tx.type === 'income' ? 'income' : 'expense'}`}>
                       {tx.type === 'income' ? '+' : '-'}{format(convert(tx.amount))}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
                  No transactions found.
                </p>
              )}
           </div>
        </div>
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

export default Dashboard;
