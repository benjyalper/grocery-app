import React, { useState } from 'react';
import { apiLogin, apiRegister } from '../api';

/**
 * מסך התחברות / הרשמה
 * mode: 'login' | 'register'
 */
function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await apiLogin(username.trim(), password)
        : await apiRegister(username.trim(), password);
      onAuth(data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
    setPassword('');
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">🛒</div>
        <h1 className="auth-title">רשימת קניות חכמה</h1>
        <p className="auth-subtitle">
          {isLogin ? 'התחבר לחשבון שלך' : 'צור חשבון חדש'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Username */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-username">שם משתמש</label>
            <input
              id="auth-username"
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="לדוגמה: משפחת לוי"
              autoComplete="username"
              dir="rtl"
              required
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">סיסמה</label>
            <input
              id="auth-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : 'לפחות 4 תווים'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              dir="ltr"
              required
            />
          </div>

          {/* Error */}
          {error && <div className="auth-error">⚠️ {error}</div>}

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn"
            disabled={loading || !username || !password}
          >
            {loading ? '⏳ מתחבר...' : isLogin ? '🔑 התחבר' : '✅ הרשם'}
          </button>
        </form>

        {/* Switch mode */}
        <div className="auth-switch">
          {isLogin ? 'אין לך חשבון עדיין?' : 'כבר יש לך חשבון?'}
          {' '}
          <button className="auth-switch-btn" onClick={switchMode} type="button">
            {isLogin ? 'הרשם עכשיו' : 'התחבר'}
          </button>
        </div>

        <p className="auth-note">
          כל משתמש מקבל רשימת קניות נפרדת ופרטית 🔒
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
