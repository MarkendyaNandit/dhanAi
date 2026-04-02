import React, { useState } from 'react';
import { sendOTP, verifyOTP, register } from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [step, setStep] = useState(0); // 0: Details, 1: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendOTP(email, phone);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOTP(email, otp);
      await register(name, email, password, phone);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-8 animation-fade-in" style={{ minHeight: '90vh', width: '100%' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
           {step === 0 ? 'Join the elite financial monitoring system' : 'Verify your contact details'}
        </p>
        
        {error && (
            <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--danger)', background: 'var(--danger-bg)', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: 0 }}>{error}</p>
            </div>
        )}

        {step === 0 ? (
            <form onSubmit={handleSendOTP} className="flex-col gap-6">
              <div className="flex-col gap-2">
                <label className="stat-label" style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.2rem' }}>Full Name</label>
                <input 
                  type="text" 
                  className="chat-input" 
                  style={{ width: '100%', borderRadius: '12px', textAlign: 'center' }}
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="flex-col gap-2">
                <label className="stat-label" style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.2rem' }}>Email Address</label>
                <input 
                  type="email" 
                  className="chat-input" 
                  style={{ width: '100%', borderRadius: '12px', textAlign: 'center' }}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="e.g. user@example.com"
                />
              </div>
              <div className="flex-col gap-2">
                <label className="stat-label" style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.2rem' }}>Phone Number</label>
                <input 
                  type="tel" 
                  className="chat-input" 
                  style={{ width: '100%', borderRadius: '12px', textAlign: 'center' }}
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  placeholder="e.g. +1 234 567 890"
                />
              </div>
              <div className="flex-col gap-2">
                <label className="stat-label" style={{ textAlign: 'center', display: 'block', width: '100%', marginBottom: '0.2rem' }}>Password</label>
                <input 
                  type="password" 
                  className="chat-input" 
                  style={{ width: '100%', borderRadius: '12px', textAlign: 'center' }}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ minWidth: '220px', height: '50px', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </div>
            </form>
        ) : (
            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-8" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.6', maxWidth: '320px' }}>
                    A 6-digit code has been sent to both your email and phone.
                </p>
                <div className="flex flex-col gap-4" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <label className="stat-label" style={{ textAlign: 'center', display: 'inline-block' }}>Enter 6-Digit OTP</label>
                    </div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <input 
                            type="text" 
                            className="chat-input" 
                            style={{ 
                                padding: '1.2rem', 
                                textAlign: 'center', 
                                fontSize: '1.8rem', 
                                letterSpacing: '0.6rem', 
                                width: '100%', 
                                maxWidth: '300px', 
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            maxLength={6}
                            required 
                            placeholder="000000"
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', width: '100%' }}>
                    <button type="submit" className="btn" style={{ width: '100%', maxWidth: '280px', height: '54px', justifyContent: 'center' }} disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>
                    <button 
                        type="button" 
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--text-secondary)', 
                            fontSize: '0.9rem', 
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            opacity: 0.8
                        }} 
                        onClick={() => setStep(0)}
                    >
                        Back to Details
                    </button>
                </div>
            </form>
        )}
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
