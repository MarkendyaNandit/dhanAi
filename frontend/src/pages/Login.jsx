import React, { useState } from 'react';
import { login } from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      onLogin(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-8 animation-fade-in" style={{ minHeight: '90vh', width: '100%' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Login to access your financial insights</p>

        {error && (
          <div className="glass-card" style={{ padding: '1rem', border: '1px solid var(--danger)', background: 'var(--danger-bg)', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-6">
          <div className="flex-col gap-2">
            <label className="stat-label" style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.8, display: 'block' }}>Email Address</label>
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
            <label className="stat-label" style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.8, display: 'block' }}>Password</label>
            <input
              type="password"
              className="chat-input"
              style={{ width: '100%', borderRadius: '12px', textAlign: 'center' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your secure password"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button type="submit" className="btn" style={{ minWidth: '200px', height: '50px', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register Now</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
