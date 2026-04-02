import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Smartphone, LogOut, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { updateProfile, getGoogleAuthUrl } from '../api';

const SecuritySettings = ({ currentUser, setCurrentUser, onLogout }) => {
    const navigate = useNavigate();
    const [passwordForm, setPasswordForm] = useState({
        current: currentUser?.password || '',
        next: '',
        confirm: ''
    });
    const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false, imap: false });
    const [imapPass, setImapPass] = useState(currentUser?.imapPassword || '');
    const [tfaEnabled, setTfaEnabled] = useState(true);
    const [message, setMessage] = useState(null);

    const location = useLocation();

    // Sync password if currentUser loads late or updates
    React.useEffect(() => {
        if (currentUser?.password) {
            setPasswordForm(prev => ({ ...prev, current: currentUser.password }));
        }
    }, [currentUser]);

    React.useEffect(() => {
        if (location.state?.flash) {
            setMessage({ type: 'success', text: location.state.flash });
            window.history.replaceState({}, document.title) // Clear state
        }
    }, [location]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.next !== passwordForm.confirm) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        try {
            const response = await updateProfile(currentUser._id, { password: passwordForm.next });
            // Update locally
            setCurrentUser(response.user);

            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordForm({ current: passwordForm.next, next: '', confirm: '' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleGlobalLogout = () => {
        if (window.confirm('Are you sure you want to log out from all devices?')) {
            onLogout();
        }
    };

    const handleGoogleLink = async () => {
        try {
            const data = await getGoogleAuthUrl();
            window.location.href = data.url;
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to initiate Google Link' });
        }
    };

    return (
        <div className="animation-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/settings')}
                    className="btn-icon"
                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '0.6rem' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Security Settings</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account protection and sessions.</p>
                </div>
            </div>

            <div className="flex-col gap-10">

                {message && (
                    <div className={`glass-card ${message.type === 'success' ? 'border-accent' : 'border-danger'}`} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} color={message.type === 'success' ? 'var(--accent-primary)' : 'var(--danger)'} />
                        <span style={{ fontSize: '0.9rem' }}>{message.text}</span>
                    </div>
                )}

                {/* Change Password - Perfect Alignment Refactor */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', width: '100%', justifyContent: 'center' }}>
                        <Lock size={18} /> Change Password
                    </h3>
                    <form onSubmit={handlePasswordChange} className="flex-col gap-10" style={{ width: '100%', maxWidth: '550px', alignItems: 'center' }}>
                        <div className="flex-col" style={{ width: '100%', gap: '180px' }}>
                            <div className="flex-col gap-2" style={{ alignItems: 'center' }}>
                                <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Current Password</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type={showPass.current ? 'text' : 'password'}
                                        className="chat-input"
                                        style={{ width: '100%', paddingRight: '3rem', textAlign: 'center' }}
                                        value={passwordForm.current}
                                        onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10 }}
                                    >
                                        {showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-col gap-2" style={{ alignItems: 'center' }}>
                                <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>New Password</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type={showPass.next ? 'text' : 'password'}
                                        className="chat-input"
                                        style={{ width: '100%', paddingRight: '3rem', textAlign: 'center' }}
                                        value={passwordForm.next}
                                        onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, next: !showPass.next })}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10 }}
                                    >
                                        {showPass.next ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-col gap-2" style={{ alignItems: 'center' }}>
                                <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Confirm Password</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        type={showPass.confirm ? 'text' : 'password'}
                                        className="chat-input"
                                        style={{ width: '100%', paddingRight: '3rem', textAlign: 'center' }}
                                        value={passwordForm.confirm}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10 }}
                                    >
                                        {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-color)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button type="submit" className="btn" style={{ minWidth: '180px', height: '48px', justifyContent: 'center' }}>Update Password</button>
                        </div>
                    </form>
                </div>

                {/* Bank Email Sync Section */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '12px' }}>
                            <Lock size={24} color="#FFC107" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Bank Email Sync (Gmail)</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                Automatically sync transactions directly from your Gmail inbox securely via OAuth2.
                            </p>
                        </div>
                    </div>

                    <div className="flex-col gap-4">
                        {currentUser?.googleRefreshToken ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
                                <CheckCircle size={18} />
                                <span>Gmail is successfully linked via OAuth2!</span>
                            </div>
                        ) : (
                            <button 
                                onClick={handleGoogleLink} 
                                className="btn" 
                                style={{ alignSelf: 'flex-start', background: 'white', color: 'black', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="18" height="18" />
                                Link with Google
                            </button>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                            Note: We use secure Google OAuth2 login. You do not need to generate any manual app passwords.
                        </p>
                    </div>
                </div>

                {/* 2FA Section */}
                <div className="glass-card flex items-center justify-between" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(76, 217, 100, 0.1)', borderRadius: '12px' }}>
                            <Smartphone size={24} color="var(--accent-primary)" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem' }}>Two-Factor Authentication</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                Add an extra layer of security to your account.
                            </p>
                        </div>
                    </div>
                    <div
                        onClick={() => setTfaEnabled(!tfaEnabled)}
                        style={{
                            width: '56px',
                            height: '30px',
                            background: tfaEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            left: tfaEnabled ? '28px' : '4px',
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

                {/* Global Logout */}
                <div className="glass-card" style={{ border: '1px solid rgba(255, 68, 68, 0.2)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.6rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '8px' }}>
                            <Shield size={20} color="var(--danger)" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--danger)' }}>Dangerous Territory</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                        Terminating all other sessions will log you out from all other browsers and devices.
                        This is recommended if you suspect any unauthorized access.
                    </p>
                    <button
                        onClick={handleGlobalLogout}
                        className="btn"
                        style={{ background: 'var(--danger)', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}
                    >
                        <LogOut size={18} /> Logout From All Devices
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
