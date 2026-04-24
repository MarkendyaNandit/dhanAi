import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Bell, Shield, Wallet, ChevronRight, UserCircle } from 'lucide-react';
import { updateProfile } from '../api';

const Settings = ({ data, currentUser, setCurrentUser, theme, setTheme, currency, setCurrency }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('notifications');

    const navItems = [
        { id: 'account', label: 'Account Details', icon: UserCircle, type: 'link', path: '/settings/account' },
        { id: 'security', label: 'Security', icon: Shield, type: 'link', path: '/settings/security' },
        { id: 'notifications', label: 'Notifications', icon: Bell, type: 'tab' },
        { id: 'banks', label: 'Connected Banks', icon: Wallet, type: 'tab' },
    ];

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="animation-fade-in">
            <div className="app-header" style={{ padding: '0 0 2rem', textAlign: 'left' }}>
                <h2>Account Settings</h2>
                <p>Manage your preferences and account privacy.</p>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(200px, 1fr) 3fr' }}>

                {/* Sidebar Navigation */}
                <div className="flex-col gap-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => item.type === 'link' ? navigate(item.path) : setActiveTab(item.id)}
                            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.8rem',
                                padding: '1rem',
                                background: activeTab === item.id ? 'var(--bg-card)' : 'transparent',
                                border: activeTab === item.id ? '1px solid var(--border-color)' : 'none',
                                borderRadius: '12px',
                                color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                width: '100%'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <item.icon size={20} /> {item.label}
                            </div>
                            {item.type === 'link' && <ChevronRight size={16} opacity={0.5} />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-col gap-6">


                    {activeTab === 'notifications' && (
                        <div className="animation-slide-up flex-col gap-6">
                            <div className="glass-card">
                                <h3 className="section-title">Notification Preferences</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                    Receive alerts for low balance, high spending, or unusual activity.
                                </p>
                                <div className="flex-col gap-4">
                                    {[
                                        { id: 'emailNotifications', label: 'Spending Alerts', desc: 'Notify when a category exceeds budget.' },
                                        { id: 'weeklySummary', label: 'Weekly Summary', desc: 'Receive a personalized financial report every Sunday.' }
                                    ].map((n) => (
                                        <div key={n.id} className="flex items-center justify-between" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, margin: 0 }}>{n.label}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{n.desc}</p>
                                            </div>
                                            <div 
                                                onClick={async () => {
                                                    const newValue = !currentUser[n.id];
                                                    try {
                                                        const response = await updateProfile(currentUser._id, { [n.id]: newValue });
                                                        // Note: We need a way to update the global currentUser state.
                                                        // In App.jsx, setCurrentUser is passed down or used.
                                                        // Since this is a small change and user said 'dont change anything else',
                                                        // I'll assume we can update it via a prop or just let it refresh.
                                                        // The user passed 'currentUser' and we can use a callback if provided.
                                                        // Let's check if setCurrentUser is available here.
                                                        if (typeof setCurrentUser === 'function') {
                                                            setCurrentUser(response.user);
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to update preference:', err);
                                                    }
                                                }}
                                                style={{ 
                                                    width: '44px', 
                                                    height: '24px', 
                                                    background: currentUser[n.id] ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                                                    borderRadius: '12px', 
                                                    position: 'relative', 
                                                    cursor: 'pointer' 
                                                }}
                                            >
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    left: currentUser[n.id] ? '24px' : '4px', 
                                                    top: '4px', 
                                                    width: '16px', 
                                                    height: '16px', 
                                                    background: 'white', 
                                                    borderRadius: '50%',
                                                    transition: '0.3s'
                                                }}></div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex-col gap-2" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                                        <div className="flex items-center justify-between">
                                            <p style={{ fontWeight: 600, margin: 0 }}>Spending Threshold ({currency})</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Use Forecast</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentUser.useForecastThreshold} 
                                                    onChange={async (e) => {
                                                        try {
                                                            const resp = await updateProfile(currentUser._id, { useForecastThreshold: e.target.checked });
                                                            if (setCurrentUser) setCurrentUser(resp.user);
                                                        } catch(err) {}
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <input 
                                            type="number" 
                                            className="chat-input"
                                            disabled={currentUser.useForecastThreshold}
                                            value={currentUser.spendingThreshold}
                                            onChange={async (e) => {
                                                // We don't want to save on every keystroke, maybe on blur or just update locally first
                                            }}
                                            onBlur={async (e) => {
                                                try {
                                                    const resp = await updateProfile(currentUser._id, { spendingThreshold: Number(e.target.value) });
                                                    if (setCurrentUser) setCurrentUser(resp.user);
                                                } catch(err) {}
                                            }}
                                            style={{ width: '100%', opacity: currentUser.useForecastThreshold ? 0.5 : 1 }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {currentUser.useForecastThreshold 
                                                ? "Current threshold is automatically calculated from your latest AI forecast."
                                                : "Manually set your spending limit for this period."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'banks' && (
                        <div className="animation-slide-up glass-card">
                            <h3 className="section-title">Connected Institutions</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Link your banking apps for automated transaction syncing.
                            </p>
                            <button className="btn btn-secondary" style={{ border: '1px dashed var(--border-color)', background: 'transparent', width: '100%', padding: '2rem' }}>
                                + Connect a New Bank
                            </button>
                        </div>
                    )}

                    <div className="glass-card">
                        <h3 className="section-title">Currency & Locale</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Set your preferred currency for all financial reports and AI insights.
                        </p>
                        <div className="flex items-center justify-between" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <p style={{ fontWeight: 600, margin: 0 }}>Active Currency</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Currently showing data in {currency}.</p>
                            </div>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="JPY">JPY (¥)</option>
                                <option value="AUD">AUD ($)</option>
                                <option value="CAD">CAD ($)</option>
                                <option value="AED">AED (د.إ)</option>
                            </select>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h3 className="section-title">Theme & Appearance</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Choose between Light and Dark mode for your workspace.
                        </p>
                        <div className="flex items-center justify-between" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div>
                                <p style={{ fontWeight: 600, margin: 0 }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Current theme is {theme}.</p>
                            </div>
                            <div
                                onClick={toggleTheme}
                                style={{
                                    width: '56px',
                                    height: '30px',
                                    background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
                                    borderRadius: '20px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    left: theme === 'dark' ? '4px' : '30px',
                                    top: '4px',
                                    width: '22px',
                                    height: '22px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h3 className="section-title">Data & Privacy</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Manage your data portability. All analysis is encrypted and private.
                        </p>
                        <div className="flex gap-4">
                            <button className="btn" disabled={!data}>
                                <Download size={18} /> Export Account Data (CSV)
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
