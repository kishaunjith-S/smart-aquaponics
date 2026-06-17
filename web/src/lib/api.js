import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No token found');
  return { Authorization: `Bearer ${token}` };
};

const extractErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0 && typeof detail[0]?.msg === 'string') {
    return detail[0].msg;
  }
  return fallback;
};

// ─── Prediction (LSTM) ─────────────────────────────────────────────────────
// Not implemented in v0 — the model is being trained externally.
// We keep these exports so the /prediction page doesn't crash on import.

export const getNext24HourPrediction = async () => {
  toast.error('Prediction is not available in v0 — LSTM model is in training.');
  throw new Error('Prediction not implemented');
};

export const getPredictionFromExcel = async () => {
  toast.error('Prediction is not available in v0.');
  throw new Error('Prediction not implemented');
};

// ─── Chat (Gemini, with auto-injected sensor context) ──────────────────────

export const sendChatMessage = async (prompt, files = []) => {
  if (files && files.length > 0) {
    toast.error('File attachments are not supported in v0.');
  }
  try {
    const response = await api.post(
      '/chat',
      { prompt },
      { headers: { ...getAuthHeader() } }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      toast.error('Session expired. Please login again.');
      throw new Error('Session expired. Please login again.');
    }
    const message = extractErrorMessage(error, 'Failed to send message');
    toast.error(message);
    throw new Error(message);
  }
};

// ─── Water quality data ────────────────────────────────────────────────────

export const getLatestWaterQualityData = async () => {
  try {
    const response = await api.get('/api/latest', {
      headers: { ...getAuthHeader() },
    });
    // Our backend returns { success, record }. Unwrap to the record itself.
    return response.data.record;
  } catch (error) {
    if (error.response?.status === 401) localStorage.removeItem('accessToken');
    throw error;
  }
};

export const getWaterQualityHistory = async (limit = 200) => {
  try {
    const response = await api.get(`/api/history?limit=${limit}`, {
      headers: { ...getAuthHeader() },
    });
    // Our backend returns { records, total }. Unwrap to just the array.
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) localStorage.removeItem('accessToken');
    throw error;
  }
};


export const getTrends = async (range = '24h') => {
  try {
    const response = await api.get(
      `/api/trends?range=${encodeURIComponent(range)}`,
      { headers: { ...getAuthHeader() } }
    );
    return response.data; // { range, since, count, points }
  } catch (error) {
    if (error.response?.status === 401) localStorage.removeItem('accessToken');
    throw error;
  }
};

// ─── API Key Management ────────────────────────────────────────────────────

export const listApiKeys = async () => {
  const response = await api.get('/api-keys', {
    headers: { ...getAuthHeader() },
  });
  return response.data;
};

export const generateApiKey = async (name) => {
  const response = await api.post(
    '/api-keys',
    { name },
    { headers: { ...getAuthHeader() } }
  );
  return response.data;
};

export const revokeApiKey = async (keyId) => {
  await api.delete(`/api-keys/${keyId}`, {
    headers: { ...getAuthHeader() },
  });
};

export default api;