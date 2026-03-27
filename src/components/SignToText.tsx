import { useState, useCallback } from 'react';
import { manifest } from '../lib/manifest';
import { SYMBOLS } from '../data/symbols';
import { trackLetterAdd, trackSignToText } from '../lib/analytics';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import './SignToText.css';

const LETTERS = Object.keys(manifest).sort((a, b) => {
  if (/^\d$/.test(a) && /^\d$/.test(b)) return Number(a) - Number(b);
  if (/^\d$/.test(a)) return 1;
  if (/^\d$/.test(b)) return -1;
  return a.localeCompare(b);
});

const ALL_CHARS = [...LETTERS, ...SYMBOLS];

export default function SignToText() {
  const [word, setWord] = useState<string[]>([]);
  const { isLowBandwidth } = useNetworkStatus();

  const addLetter = useCallback((char: string) => {
    trackLetterAdd(char);
    setWord((prev) => [...prev, char]);
  }, []);

  const removeLast = useCallback(() => setWord((prev) => prev.slice(0, -1)), []);

  const clear = useCallback(() => {
    const completed = word.join('');
    if (completed.length > 0) trackSignToText(completed);
    setWord([]);
  }, [word]);

  const copyToClipboard = useCallback(() => {
    const text = word.join('');
    if (text) navigator.clipboard.writeText(text).catch(() => {});
  }, [word]);

  const displayWord = word.join('');
  const isEmpty = word.length === 0;

  return (
    <div className="s2t">
      <div className="s2t__output">
        <div className="s2t__output-header">
          <label className="s2t__output-label" id="s2t-word-label">Your word</label>
          {!isEmpty && (
            <div className="s2t__output-actions" role="group" aria-label="Word actions">
              <button type="button" className="btn-ghost" onClick={copyToClipboard} aria-label="Copy word to clipboard" title="Copy">Copy</button>
              <button type="button" className="btn-ghost" onClick={removeLast} aria-label="Remove last letter (backspace)">⌫ Back</button>
              <button type="button" className="btn-ghost s2t__clear-btn" onClick={clear} aria-label="Clear all letters">Clear</button>
            </div>
          )}
        </div>

        <div
          className={`s2t__word${isEmpty ? ' s2t__word--empty' : ''}`}
          role="status"
          aria-live="polite"
          aria-labelledby="s2t-word-label"
          aria-label={displayWord || 'No letters selected yet'}
        >
          {isEmpty ? (
            <span className="s2t__word-placeholder">Select signs below to build a word…</span>
          ) : (
            word.map((ch, i) => (
              <span key={i} className="s2t__word-char">{ch === ' ' ? '\u00A0' : ch}</span>
            ))
          )}
        </div>

        {word.length > 0 && (
          <p className="s2t__word-count" aria-live="polite">
            {word.length} letter{word.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="s2t__keyboard" role="group" aria-label="ASL sign keyboard — tap a sign to add to your word">
        <p className="s2t__keyboard-hint" aria-hidden="true">Tap a sign to add it</p>
        <div className="s2t__grid">
          {ALL_CHARS.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => addLetter(char)}
              className="s2t__key"
              aria-label={`Add ${char === ' ' ? 'space' : char}`}
              title={char === ' ' ? 'Space' : char}
            >
              {manifest[char] ? (
                isLowBandwidth ? (
                  <div className="s2t__key-lowbw">{char}</div>
                ) : (
                  <img src={manifest[char]} alt={`ASL ${char}`} className="s2t__key-img" loading="lazy" decoding="async" />
                )
              ) : (
                <span className="s2t__key-sym">{char === ' ' ? '␣' : char}</span>
              )}
              <span className="s2t__key-label">{char === ' ' ? 'spc' : char}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
