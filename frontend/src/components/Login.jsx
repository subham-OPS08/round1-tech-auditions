import React, { useState } from 'react';
import { api, authState } from '../api.js';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(username.trim(), password);
      if (res.success && res.data) {
        authState.setToken(res.data.token);
        authState.setUser(res.data.user);
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      if (err.code === 'RATE_LIMITED') {
        const retrySec = err.extra?.retry_after || 60;
        setError(`Rate limit reached: Please wait ${retrySec} seconds before retrying.`);
      } else {
        setError(err.message || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Event Attendance</h1>
          <p>Sign in to your organiser portal</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" aria-live="assertive">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="text-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or organiser"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-demo-logins">
          <p style={{ fontWeight: 600 }}>Quick Demo Sign-ins:</p>
          <div className="quick-buttons">
            <button type="button" className="quick-btn" onClick={() => handleDemo('admin', 'Admin@123')}>Admin</button>
            <button type="button" className="quick-btn" onClick={() => handleDemo('organiser', 'Organiser@123')}>Organiser</button>
            <button type="button" className="quick-btn" onClick={() => handleDemo('viewer', 'Viewer@123')}>Viewer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
