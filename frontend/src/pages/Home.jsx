import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Shield, Zap, BrainCircuit } from 'lucide-react';

const Home = () => {
  return (
    <div className="app-container dark-theme" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', padding: '0.5rem', borderRadius: '12px' }}>
            <BrainCircuit size={28} color="white" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #a0aec0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DhanAi
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, transition: 'background 0.2s', ...hoverStyle('rgba(255,255,255,0.05)') }}>Login</Link>
          <Link to="/register" style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', textDecoration: 'none', color: 'white', fontWeight: 600, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s', ...hoverStyle('', { transform: 'scale(1.05)', opacity: 0.9 }) }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ padding: '8rem 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(100, 108, 255, 0.1) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
            ✨ Next-generation AI Financial Advisor
          </div>
          
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', fontWeight: 800, marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
            Master your money with DhanAi.
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            Automate your budgeting, analyze your spending habits, and reach your financial goals faster with our intelligent, personalized AI engine.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '12px', textDecoration: 'none', color: 'white', fontWeight: 600, fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', transition: 'all 0.3s ease', boxShadow: '0 10px 25px -5px rgba(100, 108, 255, 0.5)' }}>
              Start for free <ArrowRight size={20} />
            </Link>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }}>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section style={{ padding: '5rem 5% 8rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem', fontWeight: 700 }}>Why choose DhanAi?</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard 
            icon={<BarChart2 size={32} color="#646cff" />} 
            title="Intelligent Analysis" 
            desc="Upload your bank statements and let our AI instantly categorize your transactions with 99% accuracy."
          />
          <FeatureCard 
            icon={<Zap size={32} color="#fbbf24" />} 
            title="Instant Insights" 
            desc="Get actionable tips on where to cut back and how to grow your wealth, delivered dynamically."
          />
          <FeatureCard 
            icon={<Shield size={32} color="#10b981" />} 
            title="Bank-grade Security" 
            desc="Your financial data is encrypted at rest and in transit. We prioritize your privacy above all else."
          />
        </div>
      </section>
      
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2.5rem', transition: 'transform 0.3s, background 0.3s', cursor: 'pointer' }}
       onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
       onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}>
    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{desc}</p>
  </div>
);

// Helper for inline hover styles (simple implementation)
const hoverStyle = (bg, custom = {}) => ({
  onMouseEnter: (e) => {
    if (bg) e.currentTarget.style.background = bg;
    Object.keys(custom).forEach(key => e.currentTarget.style[key] = custom[key]);
  },
  onMouseLeave: (e) => {
    if (bg) e.currentTarget.style.background = 'transparent';
    if (custom.transform) e.currentTarget.style.transform = 'scale(1)';
    if (custom.opacity) e.currentTarget.style.opacity = '1';
  }
});

export default Home;
