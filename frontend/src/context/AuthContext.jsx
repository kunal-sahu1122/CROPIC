import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cropic_token') || null);
  const [loading, setLoading] = useState(true);

  // Configure axios default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('cropic_token', token);
      
      // Fetch current profile to ensure token is still valid
      axios.get('http://localhost:8000/api/auth/me')
        .then(response => {
          if (response.data.success) {
            setUser(response.data.user);
          }
        })
        .catch(err => {
          console.error("Session verification failed", err);
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('cropic_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email,
        password
      });
      if (response.data.success) {
        setToken(response.data.access_token);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || "Invalid email or password." 
      };
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup', {
        name,
        email,
        password,
        role
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || "Registration failed. Try again." 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cropic_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
