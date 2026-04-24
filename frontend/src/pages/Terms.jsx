import React from 'react';

const Terms = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '4rem 5%', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Terms of Service</h1>

        <ul style={{ lineHeight: '2', fontSize: '1.05rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
          <li>By using this app, you agree to use it responsibly.</li>
          <li>We are not liable for misuse.</li>
        </ul>
      </div>
    </div>
  );
};

export default Terms;
