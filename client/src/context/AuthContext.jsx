import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  // Initialize auth state on application startup
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = authService.getToken();

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getMe(storedToken);
        if (isMounted) {
          if (response?.user) {
            setUser(response.user);
            setToken(storedToken);
          } else {
            authService.removeToken();
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.warn('[Ayan AI] Auth token verification failed or expired:', err.message);
        if (isMounted) {
          authService.removeToken();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user
   * @param {object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   */
  const login = useCallback(async ({ email, password }) => {
    const data = await authService.login({ email, password });
    if (data?.token && data?.user) {
      authService.saveToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Register a new user
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.password
   */
  const signup = useCallback(async ({ name, email, password }) => {
    const data = await authService.register({ name, email, password });
    if (data?.token && data?.user) {
      authService.saveToken(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Log out user and clear authentication session
   */
  const logout = useCallback(() => {
    authService.removeToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
