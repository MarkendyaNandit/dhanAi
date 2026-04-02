const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://dhanai.onrender.com/api';

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const uploadStatement = async (file, userId) => {
  const formData = new FormData();
  formData.append('statement', file);
  formData.append('userId', userId);

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload statement');
  }

  return response.json();
};

export const fetchHistory = async (userId) => {
    const response = await fetch(`${API_URL}/analyze?userId=${userId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    return response.json();
};

export const fetchForecast = async (statementId, transactions = null, totalIncome = 0, totalExpense = 0) => {
    const response = await fetch(`${API_URL}/forecast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statementId, transactions, totalIncome, totalExpense })
    });
    if (!response.ok) throw new Error('Failed to fetch forecast');
    return response.json();
};

export const sendChatMessage = async (message, statementId, context = null) => {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, statementId, context })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
};

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Login failed');
    }
    return response.json();
};

export const sendOTP = async (email, phone) => {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to send OTP');
    }
    return response.json();
};

export const verifyOTP = async (email, code) => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Invalid OTP');
    }
    return response.json();
};

export const syncTransactions = async () => {
    const response = await fetch(`${API_URL}/analyze/sync`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
};

export const updateOverview = async (transactions, totalIncome, totalExpense) => {
    const response = await fetch(`${API_URL}/analyze/update-overview`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactions, totalIncome, totalExpense })
    });
    if (!response.ok) throw new Error('Failed to update overview');
    return response.json();
};

export const register = async (name, email, password, phone) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Registration failed');
    }
    return response.json();
};

export const updateProfile = async (userId, updates) => {
    const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, ...updates })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update profile');
    }
    return response.json();
};

export const getGoogleAuthUrl = async () => {
    const response = await fetch(`${API_URL}/auth/google/url`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch Auth URL');
    return response.json();
};

export const linkGoogleAccount = async (code, userId) => {
    const response = await fetch(`${API_URL}/auth/google/callback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, userId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to link Gmail');
    }
    return response.json();
};

