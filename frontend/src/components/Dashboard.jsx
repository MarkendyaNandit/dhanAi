import AIInsight from './AIInsight';
import Charts from './Charts';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const Dashboard = ({ data, currency = 'USD', isSyncing = false }) => {
  if (!data) return null;

  const { overview, insights, totalIncome, totalExpense, transactions } = data;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);
  };

  const remaining = totalIncome - totalExpense;

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
          <span className="stat-value income">{formatCurrency(totalIncome)}</span>
        </div>
        
        <div className="glass-card stat-card">
          <div className="flex items-center justify-between">
             <span className="stat-label">Total Spends</span>
             <ArrowDownRight color="var(--danger)" size={24} />
          </div>
          <span className="stat-value expense">{formatCurrency(totalExpense)}</span>
        </div>

        <div className="glass-card stat-card">
          <div className="flex items-center justify-between">
             <span className="stat-label">Net Remaining</span>
             <Activity color="var(--accent-primary)" size={24} />
          </div>
          <span className={`stat-value ${remaining >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      <div className="main-content">
        {/* Left Column: Chart & Overview */}
        <div className="flex-col gap-6">
          <div className="glass-card">
            <h3 className="section-title">Income vs Spendings</h3>
            <Charts transactions={transactions || []} currency={currency} />
          </div>

          <AIInsight 
            title="Financial Health Overview" 
            insight={insights?.dashboard || overview} 
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
                       {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
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

    </div>
  );
};

export default Dashboard;
