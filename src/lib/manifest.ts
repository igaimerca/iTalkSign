import datasetManifest from '../data/datasetManifest.json';
import { SYMBOLS } from '../data/symbols';
import type { DatasetManifest } from '../types';

export const manifest = datasetManifest as DatasetManifest;

export const isAllowed = (c: string): boolean =>
  manifest[c] !== undefined || SYMBOLS.includes(c);

/** Uppercase letters recognised by the manifest; preserve symbols as-is. */
export function normaliseText(text: string): string {
  return text
    .split('')
    .map((c) => (manifest[c.toUpperCase()] ? c.toUpperCase() : c))
    .filter(isAllowed)
    .join('');
}
