import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';

const History = ({ history, onSelect }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="history-section" style={{ marginTop: '3rem' }}>
      <div className="flex items-center gap-2 mb-6">
        <Clock size={20} color="var(--accent-secondary)" />
        <h3 style={{ margin: 0 }}>Recent Analyses</h3>
      </div>
      
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {history.map((item) => (
          <div 
            key={item._id}
            className="glass-card"
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '4px solid transparent',
              transition: 'all 0.3s'
            }}
            onClick={() => onSelect(item)}
            onMouseEnter={(e) => e.currentTarget.style.borderLeftColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderLeftColor = 'transparent'}
          >
            <div className="flex-col gap-1">
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                {new Date(item.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {item.transactions?.length || 0} transactions analyzed
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-secondary)" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
