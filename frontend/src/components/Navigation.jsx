import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, MessageSquare, ListTree, Settings, Target, Sparkles, LogOut, UploadCloud } from 'lucide-react';

const Navigation = ({ onLogout, onNewUpload }) => {
  const tabs = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Forecast', path: '/forecast', icon: <TrendingUp size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <ListTree size={20} /> },
    { name: 'Goal Planner', path: '/goals', icon: <Target size={20} /> },
    { name: 'AI Extract', path: '/ai-parser', icon: <Sparkles size={20} /> },
    { name: 'AI Chat', path: '/chat', icon: <MessageSquare size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ];

  return (
    <nav className="glass-card nav-container" style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '1rem', 
        padding: '0.5rem 1.5rem',
        borderRadius: '100px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)'
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '100px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            fontWeight: 500
          }}
        >
          {tab.icon}
          <span className="nav-text">{tab.name}</span>
        </NavLink>
      ))}

      {/* New Upload button */}
      {onNewUpload && (
        <button
          onClick={onNewUpload}
          title="Upload New Statement"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '100px',
            color: 'var(--accent-primary)',
            background: 'none',
            border: '1px solid var(--accent-primary)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontWeight: 500,
            fontSize: 'inherit'
          }}
        >
          <UploadCloud size={20} />
          <span className="nav-text">New Upload</span>
        </button>
      )}

      {/* Logout button */}
      {onLogout && (
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '100px',
            color: 'var(--danger)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontWeight: 500,
            fontSize: 'inherit'
          }}
        >
          <LogOut size={20} />
          <span className="nav-text">Logout</span>
        </button>
      )}
    </nav>
  );
};

export default Navigation;
