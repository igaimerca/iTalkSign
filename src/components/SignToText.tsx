import { useState, useCallback } from 'react';
import datasetManifest from '../data/datasetManifest.json';
import { SYMBOLS } from '../data/symbols';
import { trackLetterAdd, trackSignToText } from '../lib/analytics';
import type { DatasetManifest } from '../types';
import './SignToText.css';

const manifest = datasetManifest as DatasetManifest;

const LETTERS = Object.keys(manifest).sort((a, b) => {
  if (/^\d$/.test(a) && /^\d$/.test(b)) return Number(a) - Number(b);
  if (/^\d$/.test(a)) return 1;
  if (/^\d$/.test(b)) return -1;
  return a.localeCompare(b);
});

const ALL_CHARS = [...LETTERS, ...SYMBOLS];

export default function SignToText() {
  const [word, setWord] = useState<string[]>([]);

  const addLetter = useCallback((char: string) => {
    trackLetterAdd(char);
    setWord((prev) => [...prev, char]);
  }, []);

  const removeLast = useCallback(() => {
    setWord((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    const completed = word.join('');
    if (completed.length > 0) trackSignToText(completed);
    setWord([]);
  }, [word]);

  const displayWord = word.join('');
  const isEmpty = word.length === 0;

  return (
    <div className="sign-to-text">
      <div className="sign-to-text__output-area">
        <label className="sign-to-text__label">Your word</label>
        <div
          className={`sign-to-text__word ${isEmpty ? 'sign-to-text__word--empty' : ''}`}
          role="status"
          aria-live="polite"
          aria-label={displayWord || 'No letters selected'}
        >
          {displayWord || 'Select letters below to build a word'}
        </div>
        {!isEmpty && (
          <div className="sign-to-text__actions">
            <button
              type="button"
              onClick={removeLast}
              className="btn btn--secondary btn--sm"
              aria-label="Remove last letter"
            >
              ← Backspace
            </button>
            <button
              type="button"
              onClick={clear}
              className="btn btn--secondary btn--sm"
              aria-label="Clear all"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="sign-to-text__keyboard" role="group" aria-label="ASL letter and symbol selector">
        <p className="sign-to-text__keyboard-hint">Click a sign or symbol to add to your word</p>
        <div className="letter-grid">
          {ALL_CHARS.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => addLetter(char)}
              className="letter-btn"
              aria-label={`Add ${char === ' ' ? 'space' : char}`}
              title={char === ' ' ? 'Space' : char}
            >
              {manifest[char] ? (
                <img
                  src={manifest[char]}
                  alt={`ASL ${char === ' ' ? 'space' : char}`}
                  className="letter-btn__img"
                  loading="lazy"
                />
              ) : (
                <span className="letter-btn__symbol">{char === ' ' ? '␣' : char}</span>
              )}
              <span className="letter-btn__char">{char === ' ' ? 'space' : char}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
