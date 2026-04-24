import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, MessageSquare, ListTree, Settings, Target, Sparkles } from 'lucide-react';

const Navigation = () => {
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
        justifyContent: 'center', 
        gap: '1rem', 
        padding: '0.75rem 2rem',
        marginBottom: '2rem',
        borderRadius: '100px',
        position: 'sticky',
        top: '1rem',
        zIndex: 50
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
    </nav>
  );
};

export default Navigation;
