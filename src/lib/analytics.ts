const STORAGE_KEY = 'italksign_analytics';
const MAX_EVENTS = 5000;

export interface AnalyticsEvent {
  type: 'text-to-sign' | 'sign-to-text';
  timestamp: number;
  chars?: string[];
  word?: string;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  lastSession: number;
}

function load(): AnalyticsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { events: [], lastSession: Date.now() };
}

function save(data: AnalyticsData): void {
  try {
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function trackTextToSign(chars: string[]): void {
  const data = load();
  data.events.push({ type: 'text-to-sign', timestamp: Date.now(), chars });
  data.lastSession = Date.now();
  save(data);
}

export function trackSignToText(word: string): void {
  const data = load();
  data.events.push({ type: 'sign-to-text', timestamp: Date.now(), word });
  data.lastSession = Date.now();
  save(data);
}

export function trackLetterAdd(char: string): void {
  const data = load();
  data.events.push({
    type: 'sign-to-text',
    timestamp: Date.now(),
    chars: [char],
  });
  data.lastSession = Date.now();
  save(data);
}

export function getStats(): {
  totalEvents: number;
  textToSignCount: number;
  signToTextCount: number;
  letterFrequency: Record<string, number>;
  symbolFrequency: Record<string, number>;
  lastSession: number;
  sampleWords: string[];
  sampleTextToSign: string[];
  recentEvents: Array<{ type: string; label: string; time: number }>;
} {
  const data = load();
  const textToSign = data.events.filter((e) => e.type === 'text-to-sign');
  const signToText = data.events.filter((e) => e.type === 'sign-to-text');

  const letterFrequency: Record<string, number> = {};
  const symbolFrequency: Record<string, number> = {};
  const sampleWords: string[] = [];
  const sampleTextToSign: string[] = [];
  const letters = /^[A-Z0-9]$/;

  for (const e of data.events) {
    if (e.chars) {
      const str = e.chars.join('');
      for (const c of e.chars) {
        if (letters.test(c)) {
          letterFrequency[c] = (letterFrequency[c] ?? 0) + 1;
        } else {
          symbolFrequency[c === ' ' ? '␣' : c] = (symbolFrequency[c === ' ' ? '␣' : c] ?? 0) + 1;
        }
      }
      if (e.type === 'text-to-sign' && str.length > 0 && sampleTextToSign.length < 10 && !sampleTextToSign.includes(str)) {
        sampleTextToSign.push(str);
      }
    }
    if (e.word && e.word.length > 0 && sampleWords.length < 10 && !sampleWords.includes(e.word)) {
      sampleWords.push(e.word);
    }
  }

  const recentEvents = data.events
    .slice(-20)
    .reverse()
    .map((e) => {
      const label = e.word ?? (e.chars ? e.chars.join('') : '—');
      return {
        type: e.type,
        label: label.length > 30 ? label.slice(0, 30) + '…' : label,
        time: e.timestamp,
      };
    });

  return {
    totalEvents: data.events.length,
    textToSignCount: textToSign.length,
    signToTextCount: signToText.length,
    letterFrequency,
    symbolFrequency,
    lastSession: data.lastSession,
    sampleWords,
    sampleTextToSign,
    recentEvents,
  };
}

export function exportAnalytics(): string {
  const data = load();
  return JSON.stringify(data, null, 2);
}

export function clearAnalytics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
