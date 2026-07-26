import { createContext, useContext, useEffect, useState } from 'react';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  verifyLoginTwoFactor,
  otpLogin as otpLoginRequest,
  googleSignIn as googleSignInRequest,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    if (data.requires2FA) {
      return { requires2FA: true, challengeToken: data.challengeToken };
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return { user: data.user };
  };

  const completeTwoFactorLogin = async (challengeToken, code) => {
    const data = await verifyLoginTwoFactor(challengeToken, code);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // Passwordless email-OTP login — the code itself is the auth factor, so
  // this always finishes with a token (no separate 2FA step on top).
  const otpLogin = async (email, code) => {
    const data = await otpLoginRequest(email, code);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return { user: data.user };
  };

  // Sign in with Google — may still come back with a 2FA challenge if the
  // matched/linked account has 2FA enabled, same as a password login.
  const googleSignIn = async (credential) => {
    const data = await googleSignInRequest(credential);
    if (data.requires2FA) {
      return { requires2FA: true, method: data.method, challengeToken: data.challengeToken };
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return { user: data.user };
  };

  const register = async (details) => {
    const data = await registerUser(details);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    // devOtp is only ever present when no real SMTP is configured (dev mode).
    return { user: data.user, devOtp: data.devOtp };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        completeTwoFactorLogin,
        otpLogin,
        googleSignIn,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
