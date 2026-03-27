import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/auth';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pwRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(password);
    setLoading(false);
    if (result.ok) {
      navigate('/admin', { replace: true });
    } else {
      setError(result.error ?? 'Login failed.');
      setPassword('');
      pwRef.current?.focus();
    }
  };

  return (
    <div className="login-page" role="main">
      <a href="#login-form" className="skip-link">Skip to form</a>

      <div className="login-card" id="login-form">
        <div className="login-brand">
          <span className="login-brand__icon" aria-hidden="true">✋</span>
          <span className="login-brand__name">iTalkSign</span>
        </div>

        <h1 className="login-title">Admin access</h1>
        <p className="login-subtitle">Enter the admin password to continue.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="admin-password" className="login-label">Password</label>
            <div className="login-input-wrap">
              <input
                id="admin-password"
                ref={pwRef}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`login-input ${error ? 'login-input--error' : ''}`}
                autoComplete="current-password"
                aria-describedby={error ? 'login-error' : 'login-hint'}
                aria-invalid={!!error}
                required
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? '🙈' : '👁'}
              </button>
            </div>
            {error && (
              <p id="login-error" className="login-error" role="alert" aria-live="assertive">
                {error}
              </p>
            )}
            {!error && (
              <p id="login-hint" className="login-hint">
                Default password: <code>admin</code>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !password}
            aria-busy={loading}
          >
            {loading ? (
              <span className="login-btn__spinner" aria-hidden="true" />
            ) : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <a href="#/" className="login-back">← Back to app</a>
      </div>
    </div>
  );
}
