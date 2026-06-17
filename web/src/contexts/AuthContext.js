'use client';

import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch the real authenticated user via /auth/me. If the token is invalid,
  // clear local state — the user will be redirected to /login by the protected layout.
  const fetchMe = async (accessToken) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchMe(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Helper: extract a user-friendly error message from an axios error.
  // FastAPI returns `detail` as a string for HTTPException, but as an array of
  // objects for Pydantic validation errors — we handle both.
  const formatError = (error, fallback) => {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first?.msg === 'string') return first.msg;
    }
    return fallback;
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      await fetchMe(access_token);

      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      const errorMessage = formatError(error, 'Login failed. Please check your credentials.');
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (fullName, email, password) => {
    try {
      await axios.post(
        `${API_URL}/auth/register`,
        {
          full_name: fullName,
          email: email,
          password: password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error) {
      console.error('Registration failed', error);
      const errorMessage = formatError(error, 'Registration failed. Please try again.');
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;