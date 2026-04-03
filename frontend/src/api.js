const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const safeParseJson = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  throw new Error(text.substring(0, 100) || 'Server returned an error');
};

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
    const errorData = await safeParseJson(response).catch(() => ({ error: 'Failed to upload' }));
    throw new Error(errorData.error || 'Failed to upload statement');
  }

  return safeParseJson(response);
};

export const fetchHistory = async (userId) => {
    const response = await fetch(`${API_URL}/analyze?userId=${userId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    return safeParseJson(response);
};

export const fetchForecast = async (statementId, transactions = null, totalIncome = 0, totalExpense = 0) => {
    const response = await fetch(`${API_URL}/forecast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statementId, transactions, totalIncome, totalExpense })
    });
    if (!response.ok) throw new Error('Failed to fetch forecast');
    return safeParseJson(response);
};

export const sendChatMessage = async (message, statementId, context = null) => {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, statementId, context })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return safeParseJson(response);
};

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const err = await safeParseJson(response).catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || 'Login failed');
    }
    return safeParseJson(response);
};

export const sendOTP = async (email, phone) => {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
    });
    if (!response.ok) {
        const err = await safeParseJson(response).catch(() => ({ error: 'Failed to send OTP' }));
        throw new Error(err.error || 'Failed to send OTP');
    }
    return safeParseJson(response);
};

export const verifyOTP = async (email, code) => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    });
    if (!response.ok) {
        const err = await safeParseJson(response).catch(() => ({ error: 'Invalid OTP' }));
        throw new Error(err.error || 'Invalid OTP');
    }
    return safeParseJson(response);
};

export const syncTransactions = async () => {
    const response = await fetch(`${API_URL}/analyze/sync`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Sync failed');
    return safeParseJson(response);
};

export const updateOverview = async (transactions, totalIncome, totalExpense) => {
    const response = await fetch(`${API_URL}/analyze/update-overview`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactions, totalIncome, totalExpense })
    });
    if (!response.ok) throw new Error('Failed to update overview');
    return safeParseJson(response);
};

export const register = async (name, email, password, phone) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
    });
    if (!response.ok) {
        const err = await safeParseJson(response).catch(() => ({ error: 'Registration failed' }));
        throw new Error(err.error || 'Registration failed');
    }
    return safeParseJson(response);
};

export const updateProfile = async (userId, updates) => {
    const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, ...updates })
    });
    if (!response.ok) {
        const err = await safeParseJson(response).catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(err.error || 'Failed to update profile');
    }
    return safeParseJson(response);
};

export const getGoogleAuthUrl = async () => {
    const response = await fetch(`${API_URL}/auth/google/url`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch Auth URL');
    return safeParseJson(response);
};

export const linkGoogleAccount = async (code, userId) => {
    const response = await fetch(`${API_URL}/auth/google/callback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, userId })
    });
    if (!response.ok) {
        const err = await safeParseJson(response).catch(() => ({ error: 'Failed to link Gmail' }));
        throw new Error(err.error || 'Failed to link Gmail');
    }
    return safeParseJson(response);
};

