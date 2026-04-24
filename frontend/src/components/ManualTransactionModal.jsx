import React, { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';

const ManualTransactionModal = ({ isOpen, onClose, onSave }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Other');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('expense');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            amount: parseFloat(amount),
            description,
            category,
            date,
            type
        });
        setAmount('');
        setDescription('');
        onClose();
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2rem',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Add Transaction</h3>

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="flex-col gap-2">
                        <label className="stat-label">Amount</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="chat-input" 
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    <div className="flex-col gap-2">
                        <label className="stat-label">Description</label>
                        <input 
                            type="text" 
                            className="chat-input" 
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Weekly Groceries"
                        />
                    </div>

                    <div className="flex-row gap-4" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="flex-col gap-2" style={{ flex: 1 }}>
                            <label className="stat-label">Type</label>
                            <select 
                                className="chat-input" 
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div className="flex-col gap-2" style={{ flex: 1 }}>
                            <label className="stat-label">Category</label>
                            <select 
                                className="chat-input" 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="Groceries">Groceries</option>
                                <option value="Housing">Housing</option>
                                <option value="Transport">Transport</option>
                                <option value="Dining">Dining</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Health">Health</option>
                                <option value="Salary">Salary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-col gap-2">
                        <label className="stat-label">Date</label>
                        <input 
                            type="date" 
                            className="chat-input" 
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ marginTop: '1rem', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> Save Transaction
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManualTransactionModal;
