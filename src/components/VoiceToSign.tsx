import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { normaliseText, manifest } from '../lib/manifest';
import { trackTextToSign } from '../lib/analytics';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import SignCard from './SignCard';
import './VoiceToSign.css';

const SPEEDS = [
  { label: 'Slow',   ms: 1800, icon: '🐢' },
  { label: 'Normal', ms: 900,  icon: '▶' },
  { label: 'Fast',   ms: 400,  icon: '🐇' },
] as const;

type AnimState = 'idle' | 'playing' | 'paused';

export default function VoiceToSign() {
  const {
    transcript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const { isLowBandwidth } = useNetworkStatus();

  const [accumulated, setAccumulated] = useState('');
  const [wantsListening, setWantsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const wantsListeningRef = useRef(false);
  const wasListeningRef = useRef(false);

  // Animation state
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [animIndex, setAnimIndex] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const intervalRef = useRef<number | null>(null);
  const animPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debug information for GitHub Pages
    console.log('VoiceToSign Debug Info:', {
      browserSupportsSpeechRecognition,
      isMicrophoneAvailable,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      hasMediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    });
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  useEffect(() => {
    if (wasListeningRef.current && !listening) {
      if (transcript) {
        setAccumulated((prev) => (prev ? `${prev} ${transcript}` : transcript));
        resetTranscript();
      }
      if (wantsListeningRef.current) {
        SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
      }
    }
    wasListeningRef.current = listening;
  }, [listening, transcript, resetTranscript]);

  // Release mic when navigating away from this page.
  useEffect(() => () => { SpeechRecognition.abortListening(); }, []);

  const fullText = accumulated + (interimTranscript ? ` ${interimTranscript}` : '');
  const chars = useMemo(() => normaliseText(accumulated).split('').filter(Boolean), [accumulated]);

  useEffect(() => {
    if (chars.length === 0) return;
    const id = setTimeout(() => trackTextToSign(chars), 800);
    return () => clearTimeout(id);
  }, [accumulated]);

  // Reset animation when chars change (new speech added).
  useEffect(() => {
    setAnimState('idle');
    setAnimIndex(0);
  }, [accumulated]);

  // Animation interval
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

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="vtosign">
        <div className="vtosign__unsupported" role="alert">
          <span className="vtosign__unsupported-icon" aria-hidden="true">🎤</span>
          <h2>Voice recognition not supported</h2>
          <p>
            Supported browsers: <strong>Chrome</strong>, <strong>Edge</strong>,{' '}
            <strong>Safari 14.1+</strong> (macOS), <strong>Safari on iOS 15+</strong>.
          </p>
        </div>
      </div>
    );
  }

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      setMicError(null);
      
      // Check if we're in a secure context (HTTPS required for microphone)
      if (!window.isSecureContext) {
        setMicError('Microphone access requires a secure connection (HTTPS). Please use https://igaimerca.github.io/iTalkSign/');
        return false;
      }
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError('Microphone access not supported in this browser. Please try Chrome, Edge, or Safari 14.1+');
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setMicError('Microphone access was denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setMicError('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          setMicError('Microphone is already in use by another application.');
        } else {
          setMicError('Microphone access failed. Please check your browser permissions.');
        }
      }
      return false;
    }
  };

  const handleToggle = async () => {
    if (wantsListening) {
      wantsListeningRef.current = false;
      setWantsListening(false);
      SpeechRecognition.stopListening();
    } else {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }
      
      try {
        wantsListeningRef.current = true;
        setWantsListening(true);
        await SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
      } catch (error) {
        console.error('Speech recognition failed to start:', error);
        setMicError('Speech recognition failed to start. Please try again.');
        wantsListeningRef.current = false;
        setWantsListening(false);
      }
    }
  };

  const handleClear = () => {
    wantsListeningRef.current = false;
    setWantsListening(false);
    setMicError(null);
    SpeechRecognition.stopListening();
    resetTranscript();
    setAccumulated('');
  };

  return (
    <div className="vtosign">
      <div className="vtosign__hero">
        <div className="vtosign__mic-wrap">
          <button
            type="button"
            className={`vtosign__mic-btn vtosign__mic-btn--${wantsListening ? 'listening' : 'idle'}`}
            onClick={handleToggle}
            aria-label={wantsListening ? 'Stop listening' : 'Start voice recognition'}
            aria-pressed={wantsListening}
          >
            <span className="vtosign__mic-icon" aria-hidden="true">
              {wantsListening ? '⏹' : '🎤'}
            </span>
            {wantsListening && (
              <>
                <span className="vtosign__ripple vtosign__ripple--1" aria-hidden="true" />
                <span className="vtosign__ripple vtosign__ripple--2" aria-hidden="true" />
                <span className="vtosign__ripple vtosign__ripple--3" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        <p className="vtosign__status" aria-live="polite">
          {wantsListening
            ? 'Listening… speak now'
            : accumulated
            ? 'Tap again to add more'
            : 'Tap the mic and speak in English'}
        </p>

        {!isMicrophoneAvailable && (
          <p className="vtosign__mic-warn" role="alert">
            Microphone not available. Check your browser or system permissions.
          </p>
        )}

        {micError && (
          <p className="vtosign__mic-warn" role="alert">
            {micError}
          </p>
        )}

        <div className="vtosign__lang-badge" aria-label="Language: English (US)">
          <span aria-hidden="true">🇺🇸</span> English (US)
        </div>
      </div>

      {fullText && (
        <div className="vtosign__transcript-wrap">
          <div className="vtosign__transcript-label">Transcript</div>
          <div className="vtosign__transcript" aria-live="polite" aria-label="Voice transcript">
            <span className="vtosign__transcript-final">{accumulated}</span>
            {interimTranscript && (
              <span className="vtosign__transcript-interim"> {interimTranscript}</span>
            )}
          </div>
          <button type="button" className="vtosign__clear" onClick={handleClear} aria-label="Clear transcript and signs">
            Clear
          </button>
        </div>
      )}

      {isAnimOpen && (
        <div
          className="vtosign__anim-panel"
          ref={animPanelRef}
          tabIndex={-1}
          onKeyDown={handleAnimKeyDown}
          role="region"
          aria-label="Sign animation — use arrow keys or space to control"
          aria-live="polite"
        >
          <div className="vtosign__anim-close-row">
            <span className="vtosign__anim-pos" aria-live="polite" aria-atomic="true">
              {animIndex + 1} / {chars.length}
            </span>
            <div className="vtosign__speed-row" role="group" aria-label="Animation speed">
              {SPEEDS.map((s, idx) => (
                <button
                  key={s.label}
                  type="button"
                  className={`vtosign__speed-btn ${speedIdx === idx ? 'vtosign__speed-btn--active' : ''}`}
                  onClick={() => setSpeedIdx(idx)}
                  aria-pressed={speedIdx === idx}
                  title={`Speed: ${s.label}`}
                >
                  {s.icon}
                </button>
              ))}
            </div>
            <button type="button" className="vtosign__anim-close" onClick={closeAnim} aria-label="Close animation">✕</button>
          </div>

          <div className="vtosign__anim-card" aria-label={`Currently showing: ${currentChar === ' ' ? 'space' : currentChar}`}>
            {currentChar && manifest[currentChar] ? (
              <img key={`anim-${animIndex}`} src={manifest[currentChar]} alt={`ASL sign for ${currentChar}`} className="vtosign__anim-img" />
            ) : (
              <span className="vtosign__anim-symbol">{currentChar === ' ' ? '␣' : currentChar}</span>
            )}
            <span className="vtosign__anim-letter">{currentChar === ' ' ? 'space' : currentChar}</span>
          </div>

          <div className="vtosign__progress-track" role="progressbar" aria-valuenow={animIndex + 1} aria-valuemin={1} aria-valuemax={chars.length} aria-label="Sign progress">
            <div className="vtosign__progress-fill" style={{ width: `${((animIndex + 1) / chars.length) * 100}%` }} />
          </div>

          <div className="vtosign__anim-controls" role="group" aria-label="Playback controls">
            <button type="button" className="vtosign__ctrl-btn" onClick={stepPrev} aria-label="Previous sign" disabled={animIndex === 0}>‹</button>
            <button type="button" className="vtosign__ctrl-btn vtosign__ctrl-btn--play" onClick={togglePlay} aria-label={animState === 'playing' ? 'Pause' : 'Play'}>
              {animState === 'playing' ? '⏸' : '▶'}
            </button>
            <button type="button" className="vtosign__ctrl-btn" onClick={stepNext} aria-label="Next sign" disabled={animIndex === chars.length - 1}>›</button>
          </div>

          <p className="vtosign__anim-hint">← → to step · Space to play/pause · Esc to close</p>
        </div>
      )}

      {chars.length > 0 && (
        <div className="vtosign__output" role="region" aria-label="ASL sign display">
          {!isAnimOpen && (
            <div className="vtosign__output-header">
              <span className="vtosign__output-label">
                ASL signs <span className="vtosign__char-count">({chars.length})</span>
              </span>
              <button type="button" className="btn-primary vtosign__anim-btn" onClick={openAnim} aria-label="Animate signs one by one">
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
    </div>
  );
}
