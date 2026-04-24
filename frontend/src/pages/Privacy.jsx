import React from 'react';

const Privacy = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '4rem 5%', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Privacy Policy</h1>

        <ul style={{ lineHeight: '2', fontSize: '1.05rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
          <li>We collect basic user data such as email for authentication purposes.</li>
          <li>We do not share user data with third parties.</li>
          <li>All data is securely handled.</li>
        </ul>

        <p style={{ marginTop: '2rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
          Contact: <a href="mailto:saartfinance.Ai@gmail.com" style={{ color: 'var(--accent-primary)' }}>saartfinance.Ai@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export default Privacy;
