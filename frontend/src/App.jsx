import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { uploadStatement, fetchHistory, syncTransactions, updateOverview, addManualTransaction, fetchCurrentUser } from './api';
import { convertCurrency, formatCurrency } from './utils/currency';

// Components & Pages
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Transactions from './pages/Transactions';
import Forecast from './pages/Forecast';
import Settings from './pages/Settings';
import AIParser from './pages/AIParser';
import Chatbot from './pages/Chatbot';
import GoalPlanner from './pages/GoalPlanner';
import AccountDetails from './pages/AccountDetails';
import SecuritySettings from './pages/SecuritySettings';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import GoogleCallback from './pages/GoogleCallback';
import ManualTransactionModal from './components/ManualTransactionModal';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import './App.css';

function MainApp() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');
  const [newAdhocTransactions, setNewAdhocTransactions] = useState([]);

  // Persistence: Session restoration
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser()
        .then(user => {
          setCurrentUser(user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setIsAppLoading(false));
    } else {
      setIsAppLoading(false);
    }
  }, []);

  const loadHistory = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchHistory(currentUser._id);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const autoSync = async () => {
    if (isSyncing || !currentUser) return;
    setIsSyncing(true);
    try {
      const res = await syncTransactions(currentUser._id);
      if (res.newTransactions && res.newTransactions.length > 0) {
        setNewAdhocTransactions(prev => [...prev, ...res.newTransactions]);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadHistory();
      if (currentUser.imapPassword || currentUser.googleRefreshToken) {
          autoSync();
      }
    }
  }, [currentUser]);

  const mergeData = async () => {
    if (!statementData || newAdhocTransactions.length === 0) return;
    
    const updatedTransactions = [...statementData.transactions, ...newAdhocTransactions];
    const newTotalIncome = updatedTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const newTotalExpense = updatedTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    setStatementData(prev => ({
      ...prev,
      transactions: updatedTransactions,
      totalIncome: newTotalIncome,
      totalExpense: newTotalExpense
    }));
    
    setNewAdhocTransactions([]);

    try {
      const result = await updateOverview(updatedTransactions, newTotalIncome, newTotalExpense);
      setStatementData(prev => ({
        ...prev,
        overview: result.overview,
        insights: result.insights || prev.insights,
        essentials: result.essentials || prev.essentials
      }));
    } catch (err) {
      console.error("Failed to update AI overview:", err);
    }
  };

  useEffect(() => {
    if (statementData && newAdhocTransactions.length > 0) {
      mergeData();
    }
  }, [statementData, newAdhocTransactions]);

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await uploadStatement(file, currentUser._id);
      if (response && response.data) {
          setStatementData(response.data);
          loadHistory();
      } else {
          throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (data) => {
    setStatementData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStatementData(null);
    localStorage.removeItem('token');
  };

  const handleAddManual = async (tx) => {
    try {
      const saved = await addManualTransaction(tx);
      setNewAdhocTransactions(prev => [...prev, saved]);
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to add transaction: " + err.message);
    }
  };

  const openModal = () => setIsModalOpen(true);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = `${theme}-theme`;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.currency === 'INR' || data.country === 'IN') {
          setCurrency('INR');
        }
      } catch (e) {}
    };
    if (!localStorage.getItem('currency')) detectCurrency();
  }, []);

  const convertFn = useMemo(() => (amt) => convertCurrency(amt, 'INR', currency), [currency]);
  const formatFn = useMemo(() => (amt) => formatCurrency(amt, currency), [currency]);

  if (isAppLoading) {
    return (
      <div className={`app-container ${theme}-theme flex items-center justify-center`} style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`app-container ${theme}-theme`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={(user) => setCurrentUser(user)} />} />
          <Route path="/register" element={<Register onLogin={(user) => setCurrentUser(user)} />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}-theme`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="navbar" style={{ 
        background: 'rgba(10, 10, 15, 0.8)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000,
        padding: '0.75rem 0'
      }}>
        <div className="container flex items-center justify-between" style={{ display: 'flex', width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <h2 className="text-gradient" style={{ margin: 0, cursor: 'pointer', fontSize: '1.5rem' }} onClick={() => setStatementData(null)}>DhanAi</h2>
          </div>
          
          <div style={{ flex: '0 1 auto' }}>
            <Navigation onLogout={handleLogout} onNewUpload={() => setStatementData(null)} />
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            {/* This space balances the logo to keep the nav perfectly centered */}
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '2rem 0' }}>
        <Routes>
          <Route path="/" element={
            statementData ? (
              <Dashboard 
                data={statementData} 
                currency={currency} 
                isSyncing={isSyncing}
                convert={convertFn}
                format={formatFn}
                onAddTransaction={openModal}
              />
            ) : (
              <div className="animation-fade-in">
                <div className="app-header">
                  <h1 className="text-gradient">Financial Insights</h1>
                  <p>Upload your bank statement to begin analysis.</p>
                </div>
                
                <div className="upload-container">
                  {error && (
                    <div className="glass-card" style={{ border: '1px solid var(--danger)', background: 'var(--danger-bg)', marginBottom: '1.5rem' }}>
                      <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
                    </div>
                  )}
                  
                  {loading ? (
                    <div className="loader-container glass-card">
                      <div className="spinner"></div>
                      <p>Analyzing your financial data...</p>
                    </div>
                  ) : (
                    <UploadSection onUpload={handleUpload} />
                  )}
                </div>

                {history.length > 0 && !loading && (
                  <div className="glass-card" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Analysis History</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {history.map(item => (
                        <div 
                          key={item._id} 
                          className="glass-card" 
                          style={{ cursor: 'pointer', padding: '1.5rem', border: '1px solid var(--border-color)' }}
                          onClick={() => handleViewHistory(item)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {new Date(item.uploadDate).toLocaleDateString()}
                            </span>
                            <span className="badge income" style={{ fontSize: '0.7rem' }}>CSV</span>
                          </div>
                          <h4 style={{ margin: '0 0 0.5rem' }}>Statement Analysis</h4>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--success)' }}>+{formatFn(item.totalIncome)}</span>
                            <span style={{ color: 'var(--danger)' }}>-{formatFn(item.totalExpense)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          } />

          <Route path="/transactions" element={<Transactions data={statementData} currency={currency} convert={convertFn} format={formatFn} onAddTransaction={openModal} />} />
          <Route path="/forecast" element={<Forecast data={statementData} currency={currency} convert={convertFn} format={formatFn} />} />
          <Route path="/goals" element={<GoalPlanner data={statementData} currency={currency} />} />
          <Route path="/chat" element={<Chatbot currentUser={currentUser} statementData={statementData} />} />
          
          {/* Settings Sub-routes */}
          <Route path="/settings" element={<Settings data={statementData} currentUser={currentUser} setCurrentUser={setCurrentUser} theme={theme} setTheme={setTheme} currency={currency} setCurrency={setCurrency} />} />
          <Route path="/settings/account" element={<AccountDetails currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
          <Route path="/settings/security" element={<SecuritySettings currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />} />
          
          <Route path="/ai-parser" element={<AIParser onAddTransactions={(txs) => setNewAdhocTransactions(prev => [...prev, ...txs])} />} />
          <Route path="/auth/google/callback" element={<GoogleCallback currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {isModalOpen && (
        <ManualTransactionModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleAddManual}
          currency={currency}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;
