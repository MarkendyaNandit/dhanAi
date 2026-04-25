import React, { useState, useEffect, useMemo } from 'react';
import { Target, Plus, Trash2, Lightbulb, TrendingUp, CheckSquare, Square, Eye, EyeOff, Edit2, Save, X, Zap, RotateCw } from 'lucide-react';
import AIInsight from '../components/AIInsight';

// ─── Keyword Maps for Smart Detection ────────────────────────────────────
const ESSENTIAL_KEYWORDS = {
  'Housing':     ['rent', 'lease', 'apartment', 'home loan', 'mortgage', 'housing', 'property'],
  'Electricity': ['electric', 'electricity', 'power bill', 'energy bill', 'light bill'],
  'Water':       ['water bill', 'water supply', 'water utility'],
  'Gas':         ['gas bill', 'natural gas', 'piped gas', 'cooking gas', 'lpg'],
  'Internet':    ['internet', 'broadband', 'wifi', 'fibre', 'jio fiber', 'airtel xstream', 'act fibernet'],
  'Phone':       ['phone bill', 'mobile recharge', 'airtel', 'jio', 'vodafone', 'vi prepaid', 'bsnl', 'postpaid'],
  'Insurance':   ['insurance', 'premium', 'life cover', 'term plan', 'health cover', 'lic', 'star health', 'hdfc life'],
  'EMI':         ['emi', 'loan repayment', 'car loan', 'bike loan', 'personal loan', 'home loan emi'],
  'Groceries':   ['grocery', 'supermarket', 'bigbasket', 'blinkit', 'zepto', 'dmart', 'reliance fresh'],
  'Education':   ['school fee', 'tuition', 'college fee', 'course fee', 'coaching'],
  'Tax':         ['income tax', 'property tax', 'gst payment', 'advance tax'],
};

const SUBSCRIPTION_KEYWORDS = {
  'Netflix':         ['netflix'],
  'Amazon Prime':    ['amazon prime', 'prime video', 'prime membership'],
  'Spotify':         ['spotify'],
  'YouTube Premium': ['youtube premium', 'youtube music'],
  'Disney+ Hotstar': ['hotstar', 'disney+', 'disney plus'],
  'Apple':           ['apple music', 'apple tv', 'icloud', 'apple one'],
  'Gym/Fitness':     ['gym', 'fitness', 'cult.fit', 'cultfit', 'gold gym', 'anytime fitness'],
  'Cloud Storage':   ['google one', 'dropbox', 'onedrive'],
  'Gaming':          ['xbox', 'playstation', 'ps plus', 'game pass', 'steam'],
  'News/Media':      ['times prime', 'economic times', 'the hindu', 'mint'],
  'SaaS/Tools':      ['notion', 'canva', 'zoom', 'slack', 'figma', 'adobe', 'microsoft 365'],
  'OTT/Streaming':   ['sony liv', 'zee5', 'jio cinema', 'mubi', 'crunchyroll', 'hbo'],
  'Dating/Social':   ['tinder', 'bumble', 'linkedin premium'],
  'Food Delivery':   ['swiggy super', 'zomato pro', 'zomato gold'],
};

const GoalPlanner = ({ data, currency = 'USD' }) => {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('finance_goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [showSuggestions, setShowSuggestions] = useState(true);

  // Essentials Checklist State — start empty, populated by detection
  const [essentials, setEssentials] = useState(() => {
    const saved = localStorage.getItem('finance_essentials');
    return saved ? JSON.parse(saved) : [];
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

  // ─── Smart Transaction Scanner ─────────────────────────────────────────
  const autoDetected = useMemo(() => {
    if (!data?.transactions || data.transactions.length === 0) return [];

    const expenses = data.transactions.filter(t => t.type === 'expense');
    const detected = [];
    const seenLabels = new Set();

    // 1. Keyword-based detection (essentials + subscriptions)
    expenses.forEach(tx => {
      const desc = (tx.description || '').toLowerCase();

      // Check essentials
      for (const [label, keywords] of Object.entries(ESSENTIAL_KEYWORDS)) {
        if (keywords.some(kw => desc.includes(kw)) && !seenLabels.has(label)) {
          seenLabels.add(label);
          // Find all matching transactions to get the average/latest amount
          const matches = expenses.filter(t => keywords.some(kw => (t.description || '').toLowerCase().includes(kw)));
          const avgAmount = matches.reduce((s, t) => s + t.amount, 0) / matches.length;
          detected.push({
            name: label,
            amount: parseFloat(avgAmount.toFixed(2)),
            type: 'essential',
            count: matches.length
          });
        }
      }

      // Check subscriptions
      for (const [label, keywords] of Object.entries(SUBSCRIPTION_KEYWORDS)) {
        if (keywords.some(kw => desc.includes(kw)) && !seenLabels.has(label)) {
          seenLabels.add(label);
          const matches = expenses.filter(t => keywords.some(kw => (t.description || '').toLowerCase().includes(kw)));
          const avgAmount = matches.reduce((s, t) => s + t.amount, 0) / matches.length;
          detected.push({
            name: label,
            amount: parseFloat(avgAmount.toFixed(2)),
            type: 'subscription',
            count: matches.length
          });
        }
      }
    });

    // 2. Recurring pattern detection — find expenses with same description appearing 2+ times
    const descMap = {};
    expenses.forEach(tx => {
      const key = (tx.description || '').trim().toLowerCase();
      if (key.length < 3) return;
      if (!descMap[key]) descMap[key] = [];
      descMap[key].push(tx.amount);
    });

    for (const [desc, amounts] of Object.entries(descMap)) {
      if (amounts.length >= 2 && !seenLabels.has(desc)) {
        // Check if amounts are similar (within 20% of average — indicates recurring)
        const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        const isSimilar = amounts.every(a => Math.abs(a - avg) / avg < 0.2);
        if (isSimilar) {
          // Capitalize first letter of each word
          const label = desc.replace(/\b\w/g, c => c.toUpperCase());
          seenLabels.add(desc);
          detected.push({
            name: label,
            amount: parseFloat(avg.toFixed(2)),
            type: 'recurring',
            count: amounts.length
          });
        }
      }
    }

    return detected.sort((a, b) => b.amount - a.amount);
  }, [data?.transactions]);

  // Sync detected items into essentials (merge without duplicating)
  useEffect(() => {
    const allDetected = [...autoDetected];

    // Also merge backend AI essentials if available
    if (data?.essentials && data.essentials.length > 0) {
      data.essentials.forEach(e => {
        if (!allDetected.find(d => d.name.toLowerCase() === e.name.toLowerCase())) {
          allDetected.push({ ...e, type: e.type || 'essential', count: 1 });
        }
      });
    }

    if (allDetected.length === 0) return;

    setEssentials(prev => {
      const updated = [...prev];
      allDetected.forEach(detected => {
        const index = updated.findIndex(e => e.name.toLowerCase() === detected.name.toLowerCase());
        if (index !== -1) {
          // Update amount if it was 0 or different
          if (updated[index].amount === 0 || updated[index].amount !== detected.amount) {
            updated[index] = {
              ...updated[index],
              amount: detected.amount,
              type: detected.type || updated[index].type,
              count: detected.count || updated[index].count,
              checked: true
            };
          }
        } else {
          updated.push({
            id: 'auto-' + Math.random().toString(36).substr(2, 9),
            name: detected.name,
            amount: detected.amount || 0,
            type: detected.type || 'essential',
            count: detected.count || 1,
            checked: true
          });
        }
      });
      return updated;
    });
  }, [autoDetected, data?.essentials]);

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
                <div style={{ padding: '0.75rem 1.5rem', flex: 2 }}>Description</div>
                <div style={{ padding: '0.75rem 1rem', flex: 1 }}>Amount ({currency})</div>
                <div style={{ padding: '0.75rem 0.5rem', width: '110px', textAlign: 'center' }}>Type</div>
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
                    transition: 'all 0.2s',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ padding: '1rem 1.5rem', flex: 2, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ padding: '1rem 1rem', flex: 1, fontWeight: 600 }}>{formatCurrency(item.amount)}</div>
                  <div style={{ padding: '0.5rem 0.5rem', width: '110px', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      background: item.type === 'subscription' ? 'rgba(168, 85, 247, 0.15)' : item.type === 'recurring' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: item.type === 'subscription' ? '#a855f7' : item.type === 'recurring' ? '#fbbf24' : '#3b82f6'
                    }}>
                      {item.type === 'subscription' ? '⟳ Sub' : item.type === 'recurring' ? '↻ Recurring' : '⚡ Essential'}
                    </span>
                  </div>
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
