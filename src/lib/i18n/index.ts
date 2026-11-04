import type { Lang } from '../types.ts';
import { de, deTerms } from './de.ts';
import { en, enTerms, type Dict, type Terms } from './en.ts';
import { fr, frTerms } from './fr.ts';
import { it, itTerms } from './it.ts';
import { pt, ptTerms } from './pt.ts';

export const DICTS: Record<Lang, Dict> = { en, it, fr, de, pt };
export const TERMS: Record<Lang, Terms> = { en: enTerms, it: itTerms, fr: frTerms, de: deTerms, pt: ptTerms };
export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

export type Key = keyof Dict;

export function translate(lang: Lang, key: Key, params?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
