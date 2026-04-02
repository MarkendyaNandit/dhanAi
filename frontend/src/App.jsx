import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { uploadStatement, fetchHistory, syncTransactions, updateOverview } from './api';
import UploadSection from './components/UploadSection';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Forecast from './pages/Forecast';
import GoalPlanner from './pages/GoalPlanner';
import Chatbot from './pages/Chatbot';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import SecuritySettings from './pages/SecuritySettings';
import AccountDetails from './pages/AccountDetails';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import GoogleCallback from './pages/GoogleCallback';
import { Navigate } from 'react-router-dom';

function MainApp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [history, setHistory] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      loadHistory();
      autoSync();
    }
  }, [currentUser]);

  const autoSync = async () => {
    setIsSyncing(true);
    try {
      const syncData = await syncTransactions();
      if (syncData.newTransactions && syncData.newTransactions.length > 0) {
        console.log("[SYNC] Found new transactions from Email Sync:", syncData.newTransactions);
        // Store found transactions to merge when a statement is loaded
        setNewAdhocTransactions(syncData.newTransactions);
      }
    } catch (err) {
      console.warn("Auto-sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const [newAdhocTransactions, setNewAdhocTransactions] = useState([]);

  useEffect(() => {
    if (statementData && newAdhocTransactions.length > 0) {
      mergeData();
    }
  }, [statementData, newAdhocTransactions]);

  const mergeData = async () => {
    // Avoid duplicate merging if already merged
    const alreadyMerged = newAdhocTransactions.every(nt =>
      statementData.transactions.some(st => st.description === nt.description && st.amount === nt.amount)
    );

    if (alreadyMerged) return;

    console.log("[MERGE] Merging ad-hoc transactions into statement...");
    const updatedTransactions = [...statementData.transactions, ...newAdhocTransactions];

    let extraIncome = 0;
    let extraExpense = 0;
    newAdhocTransactions.forEach(t => {
      if (t.type === 'income') extraIncome += t.amount;
      else extraExpense += t.amount;
    });

    const newTotalIncome = (statementData.totalIncome || 0) + extraIncome;
    const newTotalExpense = (statementData.totalExpense || 0) + extraExpense;

    // Update basic counts first
    setStatementData({
      ...statementData,
      transactions: updatedTransactions,
      totalIncome: newTotalIncome,
      totalExpense: newTotalExpense
    });

    // Clear queue
    setNewAdhocTransactions([]);

    // Request updated AI overview and essentials based on NEW consolidated data
    try {
      setIsSyncing(true);
      const { overview, essentials, insights } = await updateOverview(updatedTransactions, newTotalIncome, newTotalExpense);
      setStatementData(prev => ({
        ...prev,
        overview: overview,
        insights: insights || prev.insights,
        essentials: essentials || prev.essentials
      }));
    } catch (err) {
      console.error("Failed to update AI overview:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadHistory = async () => {
    if (!currentUser?._id) return;
    try {
      const data = await fetchHistory(currentUser._id);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await uploadStatement(file, currentUser._id);
      setStatementData(response.data);
      loadHistory();
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
  };

  // Auto-detect user's currency based on their device location (GeoIP)
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // 1. Try GeoIP detection for "whole device location"
        const geoResponse = await fetch('https://ipapi.co/json/');
        const geoData = await geoResponse.json();

        if (geoData.currency) {
          console.log(`[LOCALE] Detected currency from GeoIP (${geoData.country_name}): ${geoData.currency}`);
          setCurrency(geoData.currency);
          return;
        }
      } catch (err) {
        console.warn("[LOCALE] GeoIP detection failed, falling back to browser locale:", err);
      }

      // 2. Fallback: browser locale & timezone logic
      try {
        const getDetectedCurrency = () => {
          // Try to get region from navigator.language
          let region = null;
          if (typeof Intl !== 'undefined' && Intl.Locale && navigator.language) {
            region = new Intl.Locale(navigator.language).region;
          }

          // Fallback: Parse from navigator.language string (e.g. "en-IN" -> "IN")
          if (!region && navigator.language.includes('-')) {
            region = navigator.language.split('-')[1].toUpperCase();
          }

          // Fallback: Try to guess from Timezone
          if (!region && typeof Intl !== 'undefined') {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes('Asia/Kolkata') || tz.includes('Asia/Calcutta')) return 'INR';
            if (tz.includes('Europe/London')) return 'GBP';
            if (tz.includes('Europe/')) return 'EUR';
            if (tz.includes('Australia/')) return 'AUD';
            if (tz.includes('Asia/Tokyo')) return 'JPY';
          }

          const currencyMap = {
            'US': 'USD', 'GB': 'GBP', 'IN': 'INR', 'JP': 'JPY',
            'AU': 'AUD', 'CA': 'CAD', 'SG': 'SGD', 'CH': 'CHF', 'AE': 'AED'
          };
          const euroZone = ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'];

          if (euroZone.includes(region)) return 'EUR';
          if (region && currencyMap[region]) return currencyMap[region];
          return 'USD';
        };

        setCurrency(getDetectedCurrency());
      } catch (e) {
        console.warn("[LOCALE] Browser locale detection also failed, falling back to USD", e);
        setCurrency('USD');
      }
    };

    detectCurrency();
  }, []);

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={setCurrentUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // If we don't have statement data loaded, show the upload screen first
  if (!statementData) {
    return (
      <div className={`app-container ${theme}-theme`} style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
        <header className="app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h1 className="text-gradient" style={{ margin: 0 }}>DhanAi</h1>
              <p style={{ margin: '0.5rem 0 0' }}>Uncover your spending habits with smart AI insights.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{currentUser.name}</p>
              <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>Logout</button>
            </div>
          </div>
          <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 500 }}>
              Auto-detected Currency: {currency}
            </span>
          </div>
        </header>

        <main>
          {!loading && <UploadSection onUpload={handleUpload} />}

          {loading && (
            <div className="loader-container">
              <div className="spinner"></div>
              <p className="text-gradient" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                AI is analyzing your statement...
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>This might take a few seconds.</p>
            </div>
          )}

          {error && (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto 2rem', border: '1px solid var(--danger)', background: 'var(--danger-bg)' }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Analysis Failed</h3>
              <p>{error}</p>
              <button className="btn" style={{ marginTop: '1rem' }} onClick={() => setError(null)}>Try Again</button>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className="glass-card" style={{ marginTop: '4rem', animation: 'fadeInUp 1s ease-out' }}>
              <h3 className="section-title">Previous Analysis History</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {history.map(item => (
                  <div
                    key={item._id}
                    className="glass-card"
                    style={{ padding: '1rem', cursor: 'pointer' }}
                    onClick={() => handleViewHistory(item)}
                  >
                    <p style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.filename}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {new Date(item.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Once data is loaded, show the full tabbed application
  return (
    <div className={`app-container ${theme}-theme`} style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="navbar flex items-center justify-between p-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h2 className="text-gradient" style={{ margin: 0 }}>DhanAi</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Account: {currentUser.name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem 1rem', borderRadius: '100px' }}>
            Currency: {currency}
          </span>
          <button
            className="btn"
            onClick={() => setStatementData(null)}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.5rem 1.5rem' }}
          >
            Upload New
          </button>
          <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}>Logout</button>
        </div>
      </header>

      <Navigation />

      <main style={{ minHeight: '60vh', padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard data={statementData} currency={currency} isSyncing={isSyncing} />} />
          <Route path="/forecast" element={<Forecast data={statementData} currency={currency} />} />
          <Route path="/goals" element={<GoalPlanner data={statementData} currency={currency} />} />
          <Route path="/transactions" element={<Transactions data={statementData} currency={currency} />} />
          <Route path="/chat" element={<Chatbot data={statementData} />} />
          <Route path="/settings" element={<Settings data={statementData} onLogout={handleLogout} theme={theme} setTheme={setTheme} currency={currency} setCurrency={setCurrency} />} />
          <Route path="/settings/security" element={<SecuritySettings currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />} />
          <Route path="/settings/account" element={<AccountDetails currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
          <Route path="/auth/google/callback" element={<GoogleCallback currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
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
