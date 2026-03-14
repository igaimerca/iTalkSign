import { useState, useCallback, useEffect } from 'react';
import datasetManifest from '../data/datasetManifest.json';
import { SYMBOLS } from '../data/symbols';
import { trackTextToSign } from '../lib/analytics';
import type { DatasetManifest } from '../types';
import './TextToSign.css';

const manifest = datasetManifest as DatasetManifest;
const allowedChars = (c: string) => manifest[c] || SYMBOLS.includes(c);

export default function TextToSign() {
  const [input, setInput] = useState('');
  const [displayText, setDisplayText] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const filtered = raw
      .split('')
      .map((c) => (manifest[c.toUpperCase()] ? c.toUpperCase() : c))
      .filter((c) => manifest[c] || SYMBOLS.includes(c))
      .join('');
    setInput(filtered);
    setDisplayText(filtered);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setDisplayText(input);
    }
  }, [input]);

  const chars = displayText.split('').filter(allowedChars);

  useEffect(() => {
    if (chars.length === 0) return;
    const id = setTimeout(() => trackTextToSign(chars), 800);
    return () => clearTimeout(id);
  }, [displayText]);

  return (
    <div className="text-to-sign">
      <label htmlFor="text-input" className="text-to-sign__label">
        Type text to see ASL signs
      </label>
      <div className="text-to-sign__input-wrap">
        <input
          id="text-input"
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="A–Z, 0–9, ! ? . , - ' ( )"
          autoComplete="off"
          autoCorrect="off"
          className="text-to-sign__input"
          aria-describedby="text-to-sign-hint"
        />
      </div>
      <p id="text-to-sign-hint" className="text-to-sign__hint">
        Letters, numbers, and symbols (! ? . , - ' ( )). Others are ignored.
      </p>

      {chars.length > 0 && (
        <div className="text-to-sign__output" role="region" aria-label="ASL sign display">
          <div className="sign-strip">
            {chars.map((char, i) => (
              <div key={`${char}-${i}`} className="sign-card" aria-label={`ASL sign for ${char === ' ' ? 'space' : char}`}>
                {manifest[char] ? (
                  <img
                    src={manifest[char]}
                    alt={`ASL hand sign for ${char === ' ' ? 'space' : char}`}
                    className="sign-card__img"
                    loading="lazy"
                  />
                ) : (
                  <span className="sign-card__symbol">{char === ' ' ? '␣' : char}</span>
                )}
                <span className="sign-card__letter">{char === ' ' ? 'space' : char}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
