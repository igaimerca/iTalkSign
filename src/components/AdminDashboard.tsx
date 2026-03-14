import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats, clearAnalytics, exportAnalytics } from '../lib/analytics';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = () => setStats(getStats());

  useEffect(() => {
    refresh();
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear all analytics data? This cannot be undone.')) {
      clearAnalytics();
      refresh();
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportAnalytics()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `italksign-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) return null;

  const sortedLetters = Object.entries(stats.letterFrequency).sort(([, a], [, b]) => b - a);
  const sortedSymbols = Object.entries(stats.symbolFrequency).sort(([, a], [, b]) => b - a);
  const maxLetterCount = Math.max(1, ...Object.values(stats.letterFrequency));
  const maxSymbolCount = Math.max(1, ...Object.values(stats.symbolFrequency));

  return (
    <div className="dashboard">
      <aside className={`dashboard__sidebar ${sidebarOpen ? 'dashboard__sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <button
            type="button"
            className="sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
          <span className="sidebar__logo">✋</span>
          <div>
            <span className="sidebar__name">iTalkSign</span>
            <span className="sidebar__label">Admin</span>
          </div>
        </div>
        <nav className="sidebar__nav">
          <div className="sidebar__section">
            <span className="sidebar__section-title">Analytics</span>
            <a href="#overview" className="sidebar__link sidebar__link--active">
              <span className="sidebar__icon">◉</span>
              Overview
            </a>
          </div>
          <div className="sidebar__section">
            <span className="sidebar__section-title">Data</span>
            <button type="button" onClick={handleExport} className="sidebar__link sidebar__btn">
              <span className="sidebar__icon">↓</span>
              Export
            </button>
          </div>
        </nav>
        <div className="sidebar__footer">
          <Link to="/" className="sidebar__back" onClick={() => setSidebarOpen(false)}>
            ← Back to app
          </Link>
        </div>
      </aside>

      <div className="dashboard__overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <main className="dashboard__main">
        <header className="dashboard__topbar">
          <button
            type="button"
            className="dashboard__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1 className="dashboard__page-title">Overview</h1>
          <button
            type="button"
            onClick={refresh}
            className="dashboard__refresh"
            aria-label="Refresh data"
          >
            ↻ Refresh
          </button>
        </header>

        <div className="dashboard__content">
      <div className="admin__grid">
        <section className="admin-card" id="overview">
          <h2 className="admin-card__title">Key metrics</h2>
          <dl className="admin-card__stats">
            <div>
              <dt>Total events</dt>
              <dd>{stats.totalEvents.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Text → Sign</dt>
              <dd>{stats.textToSignCount.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Sign → Text</dt>
              <dd>{stats.signToTextCount.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Last activity</dt>
              <dd>
                {stats.lastSession
                  ? new Date(stats.lastSession).toLocaleString()
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="admin-card">
          <h2 className="admin-card__title">Letter frequency</h2>
          {sortedLetters.length > 0 ? (
            <div className="admin-bars">
              {sortedLetters.map(([char, count]) => (
                <div key={char} className="admin-bar">
                  <span className="admin-bar__label">{char}</span>
                  <div className="admin-bar__track">
                    <div
                      className="admin-bar__fill"
                      style={{ width: `${(count / maxLetterCount) * 100}%` }}
                    />
                  </div>
                  <span className="admin-bar__value">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-card__empty">No letter data yet</p>
          )}
        </section>

        {sortedSymbols.length > 0 && (
          <section className="admin-card">
            <h2 className="admin-card__title">Symbol frequency</h2>
            <div className="admin-bars">
              {sortedSymbols.map(([char, count]) => (
                <div key={char} className="admin-bar">
                  <span className="admin-bar__label">{char}</span>
                  <div className="admin-bar__track">
                    <div
                      className="admin-bar__fill"
                      style={{ width: `${(count / maxSymbolCount) * 100}%` }}
                    />
                  </div>
                  <span className="admin-bar__value">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {(stats.sampleWords.length > 0 || stats.sampleTextToSign.length > 0) && (
          <section className="admin-card admin-card--full">
            <h2 className="admin-card__title">Sample translations</h2>
            <div className="admin-samples">
              {stats.sampleTextToSign.length > 0 && (
                <div>
                  <span className="admin-samples__label">Text → Sign:</span>
                  <div className="admin-card__words">
                    {stats.sampleTextToSign.map((w, i) => (
                      <span key={`t2s-${i}`} className="admin-word">
                        {w || '(empty)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {stats.sampleWords.length > 0 && (
                <div>
                  <span className="admin-samples__label">Sign → Text:</span>
                  <div className="admin-card__words">
                    {stats.sampleWords.map((w, i) => (
                      <span key={`s2t-${i}`} className="admin-word">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {stats.recentEvents.length > 0 && (
          <section className="admin-card admin-card--full">
            <h2 className="admin-card__title">Recent activity</h2>
            <ul className="admin-activity">
              {stats.recentEvents.map((e, i) => (
                <li key={i} className={`admin-activity__item admin-activity__item--${e.type.replace('-', '')}`}>
                  <span className="admin-activity__type">{e.type === 'text-to-sign' ? 'T→S' : 'S→T'}</span>
                  <span className="admin-activity__label">{e.label || '—'}</span>
                  <span className="admin-activity__time">
                    {new Date(e.time).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="admin__actions">
        <button
          type="button"
          onClick={handleExport}
          className="admin__btn admin__btn--secondary"
          aria-label="Export analytics data"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="admin__btn admin__btn--danger"
          aria-label="Clear analytics data"
        >
          Clear analytics
        </button>
      </div>
        </div>
      </main>
    </div>
  );
}
