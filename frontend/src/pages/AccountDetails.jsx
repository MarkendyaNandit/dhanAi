import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Hash, Lock, CheckCircle, ArrowLeft, Edit2, X, ShieldCheck, Smartphone } from 'lucide-react';
import { updateProfile, sendOTP, verifyOTP } from '../api';

const AccountDetails = ({ currentUser, setCurrentUser }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(null); // 'name', 'email', 'phone'
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    accNo: currentUser?.accNo || 'AI-BK-99203841'
  });
  
  // Sync form data with currentUser if it changes
  useEffect(() => {
    if (currentUser) {
        setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            accNo: currentUser.accNo || 'AI-BK-99203841'
        });
    }
  }, [currentUser]);

  const [otpMode, setOtpMode] = useState(null); // { field: string, value: string, target: string }
  const [otpInput, setOtpInput] = useState('');
  const [message, setMessage] = useState(null);

  const handleEdit = (field) => {
    setIsEditing(field);
  };

  const handleSave = async (field) => {
    if (field === 'email' || field === 'phone') {
        const targetLabel = field === 'email' ? 'Phone' : 'Email';
        try {
            await sendOTP(currentUser.email, currentUser.phone);
            setOtpMode({ field, value: formData[field], target: targetLabel });
        } catch (err) {
            alert(err.message);
        }
    } else {
        try {
            const response = await updateProfile(currentUser._id, { [field]: formData[field] });
            setCurrentUser(response.user);
            setIsEditing(null);
            setMessage({ type: 'success', text: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!` });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            alert(err.message);
        }
    }
  };

  const verifyOtp = async () => {
    try {
        await verifyOTP(currentUser.email, otpInput);
        const response = await updateProfile(currentUser._id, { [otpMode.field]: otpMode.value });
        setCurrentUser(response.user);
        setOtpMode(null);
        setIsEditing(null);
        setOtpInput('');
        setMessage({ type: 'success', text: `${otpMode.field.charAt(0).toUpperCase() + otpMode.field.slice(1)} verified and updated!` });
        setTimeout(() => setMessage(null), 3000);
    } catch (err) {
        alert(err.message || 'Invalid OTP. Use the code shown in the alert.');
    }
  };

  return (
    <div className="animation-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* Header & Back Button */}
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
                onClick={() => navigate('/settings')} 
                className="btn-icon" 
                style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '0.6rem' }}
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Account Details</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>View and update your personal profile information.</p>
            </div>
        </div>

        {message && (
            <div className={`glass-card animation-slide-up ${message.type === 'success' ? 'border-accent' : 'border-danger'}`} style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color={message.type === 'success' ? 'var(--accent-primary)' : 'var(--danger)'} />
                <span style={{ fontSize: '0.9rem' }}>{message.text}</span>
            </div>
        )}

        <div className="flex-col gap-6">
            
            {/* Profile Grid */}
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="flex-col gap-20" style={{ width: '100%', maxWidth: '600px' }}>
                    
                    {/* Account Number (Read Only) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', justifyContent: 'center', width: 'fit-content' }}>
                            <Hash size={24} color="var(--text-secondary)" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Number</p>
                            <p style={{ margin: 0, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.2rem' }}>{formData.accNo}</p>
                        </div>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.8rem', borderRadius: '100px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>LOCKED</span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.3, width: '100%' }}></div>

                    {/* Full Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
                            <User size={24} color="var(--accent-primary)" />
                        </div>
                        <div style={{ width: '100%' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>Full Name</p>
                            {isEditing === 'name' ? (
                                <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
                                    <input 
                                        className="chat-input" 
                                        style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        autoFocus
                                    />
                                    <button onClick={() => handleSave('name')} className="btn" style={{ justifyContent: 'center', minWidth: '120px' }}>Save</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>{formData.name}</p>
                                    <button onClick={() => handleEdit('name')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}><Edit2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.3, width: '100%' }}></div>

                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
                            <Mail size={24} color="#ec4899" />
                        </div>
                        <div style={{ width: '100%' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>Email Address</p>
                            {isEditing === 'email' ? (
                                <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
                                    <input 
                                        className="chat-input" 
                                        style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        autoFocus
                                    />
                                    <button onClick={() => handleSave('email')} className="btn" style={{ justifyContent: 'center', minWidth: '120px' }}>Verify</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>{formData.email}</p>
                                    <button onClick={() => handleEdit('email')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}><Edit2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.3, width: '100%' }}></div>

                    {/* Phone */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
                            <Phone size={24} color="#10b981" />
                        </div>
                        <div style={{ width: '100%' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>Phone Number</p>
                            {isEditing === 'phone' ? (
                                <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
                                    <input 
                                        className="chat-input" 
                                        style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        autoFocus
                                    />
                                    <button onClick={() => handleSave('phone')} className="btn" style={{ justifyContent: 'center', minWidth: '120px' }}>Verify</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>{formData.phone}</p>
                                    <button onClick={() => handleEdit('phone')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}><Edit2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.3, width: '100%' }}></div>

                    {/* Password Hook */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center' }}>
                            <Lock size={24} color="var(--text-secondary)" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>Security Password</p>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>••••••••••••</p>
                        </div>
                        <button onClick={() => navigate('/settings/security')} className="btn" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>Change Password</button>
                    </div>

                </div>
            </div>

            <div className="glass-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <ShieldCheck size={32} color="var(--accent-primary)" />
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem' }}>Identity Verification</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            Sensitive changes like updating your email or phone number require multi-factor authentication. 
                            If you update your email, we'll send a code to your phone. If you update your phone, the code goes to your email.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* OTP Verification Modal */}
        {otpMode && (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(10px)'
            }}>
                <div className="glass-card animation-zoom-in" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%' }}>
                            <Smartphone size={32} color="var(--accent-primary)" />
                        </div>
                    </div>
                    <h3>Verify Change</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        We've sent a 6-digit verification code to your <strong style={{color:'white'}}>{otpMode.target}</strong>.
                    </p>
                    
                    <div className="flex-col gap-4">
                        <input 
                            type="text" 
                            className="chat-input" 
                            placeholder="Enter Code (123456)" 
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.slice(0, 6))}
                            autoFocus
                        />
                        <button onClick={verifyOtp} className="btn" style={{ width: '100%', height: '50px' }}>
                            Verify & Update
                        </button>
                        <button onClick={() => setOtpMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default AccountDetails;
