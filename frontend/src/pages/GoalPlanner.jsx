import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Lightbulb, TrendingUp, CheckSquare, Square, Eye, EyeOff, Edit2, Save, X } from 'lucide-react';
import AIInsight from '../components/AIInsight';

const GoalPlanner = ({ data, currency = 'USD' }) => {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('finance_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [showSuggestions, setShowSuggestions] = useState(true);

  // Essentials Checklist State
  const [essentials, setEssentials] = useState(() => {
    const saved = localStorage.getItem('finance_essentials');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Rent/Home Loan', amount: 0, checked: false },
      { id: '2', name: 'Electricity Bill', amount: 0, checked: false },
      { id: '3', name: 'Car EMI', amount: 0, checked: false }
    ];
  });

  const [isAddingEssential, setIsAddingEssential] = useState(false);
  const [newEssName, setNewEssName] = useState('');
  const [newEssAmount, setNewEssAmount] = useState('');
  const [editingEssId, setEditingEssId] = useState(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('finance_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('finance_essentials', JSON.stringify(essentials));
  }, [essentials]);

  // Sync Essentials from AI detection (Merge logic)
  useEffect(() => {
    if (data?.essentials && data.essentials.length > 0) {
      setEssentials(prev => {
        const updated = [...prev];
        data.essentials.forEach(detected => {
          // Find if this essential already exists (by name, case insensitive)
          const index = updated.findIndex(e => e.name.toLowerCase() === detected.name.toLowerCase());

          if (index !== -1) {
            // If it exists but amount is 0 or different, and user hasn't manually edited it in this session?
            // For now, let's just update the amount if it's currently 0 or smaller than detected
            if (updated[index].amount === 0 || updated[index].amount !== detected.amount) {
              updated[index] = {
                ...updated[index],
                amount: detected.amount,
                // If AI detected it, mark as checked (mandatory)
                checked: true
              };
            }
          } else {
            // Add as new if doesn't exist
            updated.push({
              id: 'ai-' + Math.random().toString(36).substr(2, 9),
              name: detected.name,
              amount: detected.amount || 0,
              checked: true
            });
          }
        });
        return updated;
      });
    }
  }, [data?.essentials]);

  const addGoal = (e) => {
    e.preventDefault();
    const name = e.target.goalName.value;
    const target = e.target.goalTarget.value;
    if (!name || !target) return;
    setGoals([...goals, { id: Date.now(), name, target: parseFloat(target), saved: 0 }]);
    e.target.reset();
  };

  const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));

  const handleAddEssential = (e) => {
    e.preventDefault();
    if (!newEssName || !newEssAmount) return;
    setEssentials([...essentials, { id: Date.now().toString(), name: newEssName, amount: parseFloat(newEssAmount), checked: false }]);
    setNewEssName('');
    setNewEssAmount('');
    setIsAddingEssential(false);
  };

  const deleteEssential = (id) => setEssentials(essentials.filter(e => e.id !== id));

  const toggleEssential = (id) => {
    setEssentials(essentials.map(e => e.id === id ? { ...e, checked: !e.checked } : e));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val || 0);
  };

  const monthlySavings = (data?.totalIncome || 0) - (data?.totalExpense || 0);
  const totalEssentials = essentials.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="animation-fade-in">
      <div className="app-header" style={{ padding: '0 0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Goal Planner</h2>
          <p>Manage your goals and monthly mandatory spends.</p>
        </div>
        <button onClick={() => setShowSuggestions(!showSuggestions)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          {showSuggestions ? <EyeOff size={16} /> : <Eye size={16} />}
          {showSuggestions ? 'Hide Insights' : 'Show Insights'}
        </button>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: showSuggestions ? '1fr 350px' : '1fr' }}>
        <div className="flex-col gap-6">

          {/* Monthly Essentials Checklist (Excel Style) */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title" style={{ margin: 0, fontSize: '1rem' }}>Monthly Essentials</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsAddingEssential(!isAddingEssential)} className="btn btn-icon" style={{ borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {isAddingEssential && (
              <form onSubmit={handleAddEssential} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
                <input type="text" placeholder="Description" className="chat-input" style={{ flex: 2 }} value={newEssName} onChange={e => setNewEssName(e.target.value)} />
                <input type="number" placeholder="Amount" className="chat-input" style={{ flex: 1 }} value={newEssAmount} onChange={e => setNewEssAmount(e.target.value)} />
                <button type="submit" className="btn" style={{ fontSize: '0.8rem' }}>Save</button>
                <button type="button" onClick={() => setIsAddingEssential(false)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}><X size={14} /></button>
              </form>
            )}

            <div className="excel-table" style={{ width: '100%' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                <div style={{ padding: '0.75rem 1.5rem', flex: 2 }}>Essential Description</div>
                <div style={{ padding: '0.75rem 1rem', flex: 1 }}>Amount ({currency})</div>
                <div style={{ padding: '0.75rem 1.5rem', width: '100px', textAlign: 'center' }}>Status</div>
                <div style={{ width: '60px' }}></div>
              </div>
              {essentials.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-color)',
                    background: item.checked ? 'rgba(76, 217, 100, 0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ padding: '1rem 1.5rem', flex: 2, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ padding: '1rem 1rem', flex: 1, fontWeight: 600 }}>{formatCurrency(item.amount)}</div>
                  <div style={{ padding: '1rem 1.5rem', width: '100px', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} onClick={() => toggleEssential(item.id)}>
                    {item.checked ? <CheckSquare size={20} color="var(--accent-primary)" /> : <Square size={20} color="var(--text-secondary)" />}
                  </div>
                  <div style={{ width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => deleteEssential(item.id)} style={{ color: 'var(--danger)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 700 }}>
                <div style={{ flex: 2 }}>Total Essentials Value:</div>
                <div style={{ flex: 1 }}>{formatCurrency(totalEssentials)}</div>
                <div style={{ width: '160px' }}></div>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="glass-card">
            <h3 className="section-title"><Plus size={18} /> New Saving Goal</h3>
            <form onSubmit={addGoal} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input name="goalName" type="text" className="chat-input" style={{ flex: 2 }} placeholder="Goal name..." />
              <input name="goalTarget" type="number" className="chat-input" style={{ flex: 1 }} placeholder="Target amount..." />
              <button type="submit" className="btn">Add Goal</button>
            </form>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {goals.map(goal => {
              const progress = Math.min(100, (monthlySavings > 0 ? (monthlySavings / goal.target) * 100 : 0));
              return (
                <div key={goal.id} className="glass-card goal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>{goal.name}</h4>
                    <button onClick={() => deleteGoal(goal.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{formatCurrency(goal.target)}</div>
                  <div className="progress-container" style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{progress.toFixed(0)}% Funded</span>
                    <span>~{monthlySavings > 0 ? Math.ceil(goal.target / monthlySavings) : '∞'} mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showSuggestions && (
          <div className="flex-col gap-6">
            <AIInsight 
              title="Savings Strategy" 
              insight={data.insights?.goals} 
              color="var(--accent-primary)"
            />
            
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <span className="stat-label">Allocatable Savings</span>
              <div className="stat-value">{formatCurrency(monthlySavings)}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Monthly net surplus from statement data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalPlanner;
