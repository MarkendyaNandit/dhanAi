import React from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';

const AIInsight = ({ title = "AI Insight", insight, color = "var(--accent-primary)", format, convert }) => {
  if (!insight) return null;

  // Dynamic currency replacement logic
  const processedInsight = (() => {
    if (!format || !convert || typeof insight !== 'string') return insight;
    
    // Match patterns like ₹5,000, $100, or raw 5000 followed by "in expenses" etc.
    // This is a heuristic to replace hardcoded INR values with converted ones.
    return insight.replace(/(?:₹|\$|INR|Rs\.?)\s*([\d,]+\.?\d*)/g, (match, p1) => {
      const val = parseFloat(p1.replace(/,/g, ''));
      if (isNaN(val)) return match;
      return format(convert(val));
    });
  })();

  return (
    <div className="glass-card ai-insight-box" style={{ 
      borderLeft: `4px solid ${color}`,
      padding: '1.5rem',
      marginBottom: '2rem',
      animation: 'fadeInUp 0.8s ease-out',
      background: 'rgba(255, 255, 255, 0.02)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '-15px', 
        right: '-15px', 
        opacity: 0.05, 
        transform: 'rotate(-15deg)',
        pointerEvents: 'none'
      }}>
        <BrainCircuit size={100} />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          background: color, 
          padding: '0.5rem', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: `0 0 20px ${color}33`
        }}>
          <Sparkles size={18} color="white" />
        </div>
        <h4 style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          fontWeight: 700, 
          letterSpacing: '0.1em', 
          textTransform: 'uppercase', 
          color: 'var(--text-primary)',
          opacity: 0.9
        }}>
          {title}
        </h4>
      </div>
      
      <p style={{ 
        margin: 0, 
        lineHeight: '1.7', 
        color: 'var(--text-secondary)',
        fontSize: '1.05rem',
        fontWeight: 400,
        position: 'relative',
        zIndex: 1
      }}>
        {processedInsight}
      </p>
      
      <div style={{ 
        height: '1px', 
        width: '100%', 
        background: `linear-gradient(90deg, ${color}33, transparent)`,
        marginTop: '0.5rem'
      }} />
    </div>
  );
};

export default AIInsight;
