import React, { useState } from 'react';
import { Database, PlusCircle, AlertCircle, CheckCircle, Loader, FileText, X } from 'lucide-react';
import UploadSection from '../components/UploadSection';
import { useNavigate } from 'react-router-dom';

const AIExtract = ({ onMerge, isMerging }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [mergeStats, setMergeStats] = useState(null);
  const navigate = useNavigate();

  const handleMergeUpload = async (file, password) => {
    try {
      const response = await onMerge(file, password);
      if (response && !response.requiresPassword) {
        setMergeStats({
            count: response.data.transactions?.length || 0,
            filename: file.name
        });
        setShowSuccess(true);
      }
      return response;
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="animation-fade-in" style={{ padding: '2rem 0' }}>
      <div className="app-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>AI Extract & Merge</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Append a new bank statement to your current profile. AI will merge the data and recompute your financial health across all pages.
        </p>
      </div>

      {!showSuccess ? (
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1.25rem 2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <PlusCircle size={24} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    <strong style={{ color: 'var(--accent-primary)' }}>Cumulative Mode:</strong> Any transactions found in the new statement will be added to your current history. Duplicate records are automatically filtered.
                </div>
            </div>

            <UploadSection onUpload={handleMergeUpload} />
            
            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', opacity: 0.7 }}>
                <p>Use this to combine HDFC + SBI, or Jan + Feb statements into one profile.</p>
            </div>
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem', textAlign: 'center', animation: 'fadeInUp 0.5s ease-out' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Merge Successful!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Successfully extracted <strong>{mergeStats?.count} transactions</strong> from <em>{mergeStats?.filename}</em> and merged them into your profile.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="btn" onClick={() => navigate('/')} style={{ background: 'var(--accent-primary)', color: 'white' }}>
                View Dashboard
            </button>
            <button className="btn btn-secondary" onClick={() => setShowSuccess(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Merge Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExtract;
