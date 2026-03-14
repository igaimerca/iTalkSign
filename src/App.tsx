import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import TextToSign from './components/TextToSign';
import SignToText from './components/SignToText';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

type Tab = 'text-to-sign' | 'sign-to-text';

function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('text-to-sign');

  return (
    <>
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <span className="logo-icon">✋</span>
            iTalkSign
          </h1>
          <p className="tagline">ASL Sign Language Translator</p>
          <nav className="tabs" role="tablist" aria-label="Module selection">
            <button
              role="tab"
              aria-selected={activeTab === 'text-to-sign'}
              aria-controls="panel-text-to-sign"
              id="tab-text-to-sign"
              className={`tab ${activeTab === 'text-to-sign' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('text-to-sign')}
            >
              Text → Sign
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'sign-to-text'}
              aria-controls="panel-sign-to-text"
              id="tab-sign-to-text"
              className={`tab ${activeTab === 'sign-to-text' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('sign-to-text')}
            >
              Sign → Text
            </button>
          </nav>
        </div>
      </header>
      <main className="main">
        {activeTab === 'text-to-sign' && (
          <section
            id="panel-text-to-sign"
            role="tabpanel"
            aria-labelledby="tab-text-to-sign"
            className="panel"
          >
            <TextToSign />
          </section>
        )}
        {activeTab === 'sign-to-text' && (
          <section
            id="panel-sign-to-text"
            role="tabpanel"
            aria-labelledby="tab-sign-to-text"
            className="panel"
          >
            <SignToText />
          </section>
        )}
      </main>
      <footer className="footer">
        <p>
          iTalkSign — Aime Igirimpuhwe
          <Link to="/admin" className="footer__admin">
            {' · '}Admin
          </Link>
        </p>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}
