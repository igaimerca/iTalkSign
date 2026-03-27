import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { manifest, normaliseText } from '../lib/manifest';
import { trackTextToSign } from '../lib/analytics';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import SignCard from './SignCard';
import './TextToSign.css';

const SPEEDS = [
  { label: 'Slow',   ms: 1800, icon: '🐢' },
  { label: 'Normal', ms: 900,  icon: '▶' },
  { label: 'Fast',   ms: 400,  icon: '🐇' },
] as const;

type AnimState = 'idle' | 'playing' | 'paused';

export default function TextToSign() {
  const [displayText, setDisplayText] = useState('');
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [animIndex, setAnimIndex] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const intervalRef = useRef<number | null>(null);
  const animPanelRef = useRef<HTMLDivElement>(null);
  const { isLowBandwidth } = useNetworkStatus();

  const chars = useMemo(() => normaliseText(displayText).split(''), [displayText]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayText(normaliseText(e.target.value));
    setAnimState('idle');
    setAnimIndex(0);
  }, []);

  useEffect(() => {
    if (chars.length === 0) return;
    const id = setTimeout(() => trackTextToSign(chars), 800);
    return () => clearTimeout(id);
  }, [displayText]);

  useEffect(() => {
    if (animState !== 'playing') return;
    const ms = SPEEDS[speedIdx].ms;
    intervalRef.current = window.setInterval(() => {
      setAnimIndex((i) => {
        if (i >= chars.length - 1) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setAnimState('paused');
          return i;
        }
        return i + 1;
      });
    }, ms);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [animState, speedIdx, chars.length]);

  useEffect(() => {
    if (animState !== 'idle') animPanelRef.current?.focus();
  }, [animState]);

  const handleAnimKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (animState === 'idle') return;
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); setAnimState('paused'); setAnimIndex((i) => Math.min(i + 1, chars.length - 1)); break;
      case 'ArrowLeft':  e.preventDefault(); setAnimState('paused'); setAnimIndex((i) => Math.max(i - 1, 0)); break;
      case ' ':          e.preventDefault(); setAnimState((s) => (s === 'playing' ? 'paused' : 'playing')); break;
      case 'Escape':     e.preventDefault(); setAnimState('idle'); break;
    }
  }, [animState, chars.length]);

  const openAnim  = () => { setAnimIndex(0); setAnimState('playing'); };
  const closeAnim = () => { setAnimState('idle'); if (intervalRef.current) clearInterval(intervalRef.current); };
  const togglePlay = () => {
    if (animState === 'playing') { setAnimState('paused'); return; }
    if (animIndex >= chars.length - 1) setAnimIndex(0);
    setAnimState('playing');
  };
  const stepPrev = () => { setAnimState('paused'); setAnimIndex((i) => Math.max(i - 1, 0)); };
  const stepNext = () => { setAnimState('paused'); setAnimIndex((i) => Math.min(i + 1, chars.length - 1)); };

  const isAnimOpen = animState !== 'idle';
  const currentChar = chars[animIndex];

  return (
    <div className="t2s">
      <div className="t2s__input-group">
        <label htmlFor="t2s-input" className="t2s__label">Type text to translate</label>
        <input
          id="t2s-input"
          type="text"
          value={displayText}
          onChange={handleInputChange}
          placeholder="A–Z · 0–9 · ! ? . , - ' ( )"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="t2s__input"
          aria-describedby="t2s-hint"
        />
        <p id="t2s-hint" className="t2s__hint">
          Letters and numbers auto-capitalise. Unsupported characters are ignored.
        </p>
      </div>

      {isAnimOpen && (
        <div
          className="t2s__anim-panel"
          ref={animPanelRef}
          tabIndex={-1}
          onKeyDown={handleAnimKeyDown}
          role="region"
          aria-label="Sign animation — use arrow keys or space to control"
          aria-live="polite"
        >
          <div className="t2s__anim-close-row">
            <span className="t2s__anim-pos" aria-live="polite" aria-atomic="true">
              {animIndex + 1} / {chars.length}
            </span>
            <div className="t2s__speed-row" role="group" aria-label="Animation speed">
              {SPEEDS.map((s, idx) => (
                <button
                  key={s.label}
                  type="button"
                  className={`t2s__speed-btn ${speedIdx === idx ? 't2s__speed-btn--active' : ''}`}
                  onClick={() => setSpeedIdx(idx)}
                  aria-pressed={speedIdx === idx}
                  title={`Speed: ${s.label}`}
                >
                  {s.icon}
                </button>
              ))}
            </div>
            <button type="button" className="t2s__anim-close" onClick={closeAnim} aria-label="Close animation">✕</button>
          </div>

          <div className="t2s__anim-card" aria-label={`Currently showing: ${currentChar === ' ' ? 'space' : currentChar}`}>
            {currentChar && manifest[currentChar] ? (
              <img key={`anim-${animIndex}`} src={manifest[currentChar]} alt={`ASL sign for ${currentChar}`} className="t2s__anim-img" />
            ) : (
              <span className="t2s__anim-symbol">{currentChar === ' ' ? '␣' : currentChar}</span>
            )}
            <span className="t2s__anim-letter">{currentChar === ' ' ? 'space' : currentChar}</span>
          </div>

          <div className="t2s__progress-track" role="progressbar" aria-valuenow={animIndex + 1} aria-valuemin={1} aria-valuemax={chars.length} aria-label="Sign progress">
            <div className="t2s__progress-fill" style={{ width: `${((animIndex + 1) / chars.length) * 100}%` }} />
          </div>

          <div className="t2s__anim-controls" role="group" aria-label="Playback controls">
            <button type="button" className="t2s__ctrl-btn" onClick={stepPrev} aria-label="Previous sign" disabled={animIndex === 0}>‹</button>
            <button type="button" className="t2s__ctrl-btn t2s__ctrl-btn--play" onClick={togglePlay} aria-label={animState === 'playing' ? 'Pause' : 'Play'}>
              {animState === 'playing' ? '⏸' : '▶'}
            </button>
            <button type="button" className="t2s__ctrl-btn" onClick={stepNext} aria-label="Next sign" disabled={animIndex === chars.length - 1}>›</button>
          </div>

          <p className="t2s__anim-hint">← → to step · Space to play/pause · Esc to close</p>
        </div>
      )}

      {chars.length > 0 && (
        <div className="t2s__output" role="region" aria-label="ASL sign display">
          {!isAnimOpen && (
            <div className="t2s__output-header">
              <span className="t2s__output-count">{chars.length} sign{chars.length !== 1 ? 's' : ''}</span>
              <button type="button" className="btn-primary t2s__anim-btn" onClick={openAnim} aria-label="Animate signs one by one">
                ▶ Animate
              </button>
            </div>
          )}
          <div className="sign-strip" role="list" aria-label="Signs">
            {chars.map((char, i) => (
              <SignCard
                key={`${char}-${i}`}
                char={char}
                active={isAnimOpen && i === animIndex}
                isLowBandwidth={isLowBandwidth}
                role="listitem"
                aria-current={isAnimOpen && i === animIndex ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {chars.length === 0 && displayText.length === 0 && (
        <div className="t2s__empty" aria-hidden="true">
          <span className="t2s__empty-icon">✋</span>
          <p>Start typing above to see ASL signs appear here.</p>
        </div>
      )}
    </div>
  );
}
