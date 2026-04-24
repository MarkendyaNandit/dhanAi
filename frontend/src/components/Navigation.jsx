import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, MessageSquare, ListTree, Settings, Target, Sparkles } from 'lucide-react';

const Navigation = () => {
  const tabs = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    { name: 'Forecast', path: '/forecast', icon: <TrendingUp size={16} /> },
    { name: 'Transactions', path: '/transactions', icon: <ListTree size={16} /> },
    { name: 'Goal Planner', path: '/goals', icon: <Target size={16} /> },
    { name: 'AI Extract', path: '/ai-parser', icon: <Sparkles size={16} /> },
    { name: 'AI Chat', path: '/chat', icon: <MessageSquare size={16} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={16} /> }
  ];

  return (
    <nav className="nav-container" style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '0.25rem', 
        padding: '0.35rem 0.5rem',
        borderRadius: '100px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-color)',
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '100px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            fontWeight: 500,
            fontSize: '0.82rem',
            whiteSpace: 'nowrap'
          }}
        >
          {tab.icon}
          <span className="nav-text">{tab.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default Navigation;
