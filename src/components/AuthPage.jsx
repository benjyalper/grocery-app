import React, { useState } from 'react';
import { apiLogin, apiRegister } from '../api';
import { useLanguage } from '../LanguageContext';

function AuthPage({ onAuth }) {
  const { t, lang, toggle: toggleLang, isRTL } = useLanguage();

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
        {/* Language toggle — top corner */}
        <button className="auth-lang-toggle" onClick={toggleLang} title="Switch language">
          {t('langToggle')}
        </button>

        {/* Logo */}
        <div className="auth-logo">🛒</div>
        <h1 className="auth-title">{t('appTitle')}</h1>
        <p className="auth-subtitle">
          {isLogin ? t('loginTitle') : t('registerTitle')}
        </p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-username">{t('usernameLabel')}</label>
            <input
              id="auth-username"
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Smith family' : 'לדוגמה: משפחת לוי'}
              autoComplete="username"
              dir={isRTL ? 'rtl' : 'ltr'}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">{t('passwordLabel')}</label>
            <input
              id="auth-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : (lang === 'en' ? 'At least 4 characters' : 'לפחות 4 תווים')}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              dir="ltr"
              required
            />
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <button
            type="submit"
            className="auth-btn"
            disabled={loading || !username || !password}
          >
            {loading
              ? `⏳ ${t('connecting')}`
              : isLogin ? t('loginBtn') : t('registerBtn')}
          </button>
        </form>

        <div className="auth-switch">
          <button className="auth-switch-btn" onClick={switchMode} type="button">
            {isLogin ? t('goRegister') : t('goLogin')}
          </button>
        </div>

        <p className="auth-note">{t('privacyNote')}</p>
      </div>
    </div>
  );
}

export default AuthPage;
