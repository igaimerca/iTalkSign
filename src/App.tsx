import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import TextToSign from './components/TextToSign';
import SignToText from './components/SignToText';
import VoiceToSign from './components/VoiceToSign';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import NetworkBanner from './components/NetworkBanner';
import { logout, isAuthenticated } from './lib/auth';
import './App.css';

function AppShell() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  if (isAdminArea) return null; // admin pages render their own layout

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="app-header" role="banner">
        <div className="app-header__inner">
          <NavLink to="/text-to-sign" className="app-logo" aria-label="iTalkSign — home">
            <span className="app-logo__icon" aria-hidden="true">✋</span>
            <span className="app-logo__name">iTalkSign</span>
          </NavLink>

          <nav className="app-nav" role="navigation" aria-label="Main navigation">
            <NavLink
              to="/text-to-sign"
              className={({ isActive }) => `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`}
            >
              Text → Sign
            </NavLink>
            <NavLink
              to="/voice-to-sign"
              className={({ isActive }) => `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`}
            >
              Voice → Sign
            </NavLink>
            <NavLink
              to="/sign-to-text"
              className={({ isActive }) => `app-nav__link ${isActive ? 'app-nav__link--active' : ''}`}
            >
              Sign → Text
            </NavLink>
          </nav>

          <NavLink
            to={isAuthenticated() ? '/admin' : '/admin/login'}
            className="app-header__admin"
            aria-label="Admin dashboard"
          >
            Admin
          </NavLink>
        </div>
      </header>

      <NetworkBanner />
    </>
  );
}

function FeaturePage({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="feature-main" id="main-content" tabIndex={-1}>
      <div className="feature-wrap">
        <div className="feature-header">
          <h1 className="feature-title">{title}</h1>
          <p className="feature-subtitle">{subtitle}</p>
        </div>
        <div className="feature-card">
          {children}
        </div>
      </div>
      <footer className="app-footer" role="contentinfo">
        iTalkSign — Aime Igirimpuhwe &nbsp;·&nbsp;
        <span className="app-footer__note">ASL Alphabet Translator</span>
      </footer>
    </main>
  );
}

function AdminWrapper() {
  const handleLogout = () => {
    logout();
    window.location.href = '#/';
  };
  return (
    <ProtectedRoute>
      <AdminDashboard onLogout={handleLogout} />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <div className="app">
      <AppShell />
      <Routes>
        <Route path="/" element={<Navigate to="/text-to-sign" replace />} />
        <Route
          path="/text-to-sign"
          element={
            <FeaturePage title="Text to Sign" subtitle="Type text to see the ASL hand signs.">
              <TextToSign />
            </FeaturePage>
          }
        />
        <Route
          path="/voice-to-sign"
          element={
            <FeaturePage title="Voice to Sign" subtitle="Speak in English — your words appear as ASL signs.">
              <VoiceToSign />
            </FeaturePage>
          }
        />
        <Route
          path="/sign-to-text"
          element={
            <FeaturePage title="Sign to Text" subtitle="Tap ASL signs to build a word or phrase.">
              <SignToText />
            </FeaturePage>
          }
        />
        <Route path="/admin" element={<AdminWrapper />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/text-to-sign" replace />} />
      </Routes>
    </div>
  );
}
