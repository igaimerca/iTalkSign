import { useState, useEffect } from 'react';
import { getStats, clearAnalytics, exportAnalytics } from '../lib/analytics';
import { changePassword } from '../lib/auth';
import type { AuthResult } from '../lib/auth';
import './AdminDashboard.css';

interface Props {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: Props) {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'settings'>('overview');

  // Change password form
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwResult, setPwResult] = useState<AuthResult | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const refresh = () => setStats(getStats());
  useEffect(() => { refresh(); }, []);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNext !== pwConfirm) {
      setPwResult({ ok: false, error: 'New passwords do not match.' });
      return;
    }
    setPwLoading(true);
    const result = await changePassword(pwCurrent, pwNext);
    setPwLoading(false);
    setPwResult(result);
    if (result.ok) {
      setPwCurrent(''); setPwNext(''); setPwConfirm('');
    }
  };

  if (!stats) return null;

  const sortedLetters = Object.entries(stats.letterFrequency).sort(([, a], [, b]) => b - a);
  const sortedSymbols = Object.entries(stats.symbolFrequency).sort(([, a], [, b]) => b - a);
  const maxLetterCount = Math.max(1, ...Object.values(stats.letterFrequency));
  const maxSymbolCount = Math.max(1, ...Object.values(stats.symbolFrequency));

  const nav = [
    { id: 'overview' as const, label: 'Overview', icon: '◉' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙' },
  ];

  return (
    <div className="dash">
      {/* ── Sidebar ── */}
      <aside
        className={`dash__sidebar ${sidebarOpen ? 'dash__sidebar--open' : ''}`}
        aria-label="Admin navigation"
      >
        <div className="dash__sidebar-inner">
          <div className="dash__brand">
            <button
              type="button"
              className="dash__sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              ✕
            </button>
            <span className="dash__brand-icon" aria-hidden="true">✋</span>
            <div>
              <span className="dash__brand-name">iTalkSign</span>
              <span className="dash__brand-tag">Admin</span>
            </div>
          </div>

          <nav aria-label="Admin sections">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`dash__nav-link ${activeSection === item.id ? 'dash__nav-link--active' : ''}`}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="dash__sidebar-footer">
            <a href="#/text-to-sign" className="dash__back-link">← Back to app</a>
            <button type="button" className="dash__logout-btn" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="dash__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="dash__main" id="main-content" tabIndex={-1}>
        <header className="dash__topbar">
          <button
            type="button"
            className="dash__menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            ☰
          </button>
          <h1 className="dash__page-title">
            {activeSection === 'overview' ? 'Overview' : 'Settings'}
          </h1>
          {activeSection === 'overview' && (
            <button
              type="button"
              onClick={refresh}
              className="dash__refresh-btn"
              aria-label="Refresh analytics data"
            >
              ↻ Refresh
            </button>
          )}
        </header>

        <div className="dash__content">

          {activeSection === 'overview' && (
            <>
              <section className="dash__section" aria-labelledby="metrics-heading">
                <h2 id="metrics-heading" className="dash__section-title">Key metrics</h2>
                <dl className="dash__metrics">
                  <div className="dash__metric">
                    <dt>Total events</dt>
                    <dd>{stats.totalEvents.toLocaleString()}</dd>
                  </div>
                  <div className="dash__metric">
                    <dt>Text → Sign</dt>
                    <dd>{stats.textToSignCount.toLocaleString()}</dd>
                  </div>
                  <div className="dash__metric">
                    <dt>Sign → Text</dt>
                    <dd>{stats.signToTextCount.toLocaleString()}</dd>
                  </div>
                  <div className="dash__metric">
                    <dt>Last activity</dt>
                    <dd className="dash__metric-date">
                      {stats.lastSession
                        ? new Date(stats.lastSession).toLocaleString()
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              <div className="dash__charts">
                <section className="dash__card" aria-labelledby="letters-heading">
                  <h2 id="letters-heading" className="dash__card-title">Letter frequency</h2>
                  {sortedLetters.length > 0 ? (
                    <div className="dash__bars" role="list">
                      {sortedLetters.map(([char, count]) => (
                        <div key={char} className="dash__bar" role="listitem">
                          <span className="dash__bar-label">{char}</span>
                          <div
                            className="dash__bar-track"
                            role="img"
                            aria-label={`${char}: ${count} uses`}
                          >
                            <div
                              className="dash__bar-fill"
                              style={{ width: `${(count / maxLetterCount) * 100}%` }}
                            />
                          </div>
                          <span className="dash__bar-val">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dash__empty">No data yet. Use the app to generate analytics.</p>
                  )}
                </section>

                {sortedSymbols.length > 0 && (
                  <section className="dash__card" aria-labelledby="symbols-heading">
                    <h2 id="symbols-heading" className="dash__card-title">Symbol frequency</h2>
                    <div className="dash__bars" role="list">
                      {sortedSymbols.map(([char, count]) => (
                        <div key={char} className="dash__bar" role="listitem">
                          <span className="dash__bar-label">{char}</span>
                          <div className="dash__bar-track" aria-label={`${char}: ${count}`}>
                            <div
                              className="dash__bar-fill"
                              style={{ width: `${(count / maxSymbolCount) * 100}%` }}
                            />
                          </div>
                          <span className="dash__bar-val">{count}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {(stats.sampleWords.length > 0 || stats.sampleTextToSign.length > 0) && (
                <section className="dash__card" aria-labelledby="samples-heading">
                  <h2 id="samples-heading" className="dash__card-title">Sample translations</h2>
                  <div className="dash__samples">
                    {stats.sampleTextToSign.length > 0 && (
                      <div>
                        <span className="dash__samples-sub">Text → Sign</span>
                        <div className="dash__words">
                          {stats.sampleTextToSign.map((w, i) => (
                            <code key={i} className="dash__word">{w || '(empty)'}</code>
                          ))}
                        </div>
                      </div>
                    )}
                    {stats.sampleWords.length > 0 && (
                      <div>
                        <span className="dash__samples-sub">Sign → Text</span>
                        <div className="dash__words">
                          {stats.sampleWords.map((w, i) => (
                            <code key={i} className="dash__word">{w}</code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {stats.recentEvents.length > 0 && (
                <section className="dash__card" aria-labelledby="activity-heading">
                  <h2 id="activity-heading" className="dash__card-title">Recent activity</h2>
                  <ul className="dash__activity" role="list">
                    {stats.recentEvents.map((ev, i) => (
                      <li key={i} className="dash__activity-item">
                        <span className={`dash__ev-badge dash__ev-badge--${ev.type === 'text-to-sign' ? 'tts' : 'stt'}`}>
                          {ev.type === 'text-to-sign' ? 'T→S' : 'S→T'}
                        </span>
                        <span className="dash__ev-label">{ev.label || '—'}</span>
                        <time className="dash__ev-time">{new Date(ev.time).toLocaleTimeString()}</time>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="dash__actions">
                <button type="button" onClick={handleExport} className="btn-ghost">
                  Export JSON
                </button>
                <button type="button" onClick={handleClear} className="btn-danger">
                  Clear analytics
                </button>
              </div>
            </>
          )}

          {activeSection === 'settings' && (
            <section className="dash__card" aria-labelledby="pw-heading">
              <h2 id="pw-heading" className="dash__card-title">Change admin password</h2>
              <p className="dash__settings-hint">
                Password is hashed with SHA-256 and stored locally. Default: <code>admin</code>
              </p>
              <form
                className="dash__pw-form"
                onSubmit={handleChangePassword}
                noValidate
                aria-label="Change password"
              >
                <label className="dash__pw-label" htmlFor="pw-current">Current password</label>
                <input
                  id="pw-current"
                  type="password"
                  className="dash__pw-input"
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <label className="dash__pw-label" htmlFor="pw-next">New password</label>
                <input
                  id="pw-next"
                  type="password"
                  className="dash__pw-input"
                  value={pwNext}
                  onChange={(e) => setPwNext(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <label className="dash__pw-label" htmlFor="pw-confirm">Confirm new password</label>
                <input
                  id="pw-confirm"
                  type="password"
                  className="dash__pw-input"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                {pwResult && (
                  <p
                    className={`dash__pw-msg dash__pw-msg--${pwResult.ok ? 'ok' : 'err'}`}
                    role="alert"
                    aria-live="polite"
                  >
                    {pwResult.ok ? 'Password updated successfully.' : pwResult.error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={pwLoading || !pwCurrent || !pwNext || !pwConfirm}
                  aria-busy={pwLoading}
                >
                  {pwLoading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
