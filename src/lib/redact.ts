export const REDACTED = '▇▇▇';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Hides the card's names from its text: every full name (case-insensitive), plus
 * any quoted "..." fragment that is part of one of the names (e.g. "Neos" for
 * "Elemental HERO Neos").
 */
export function redact(text: string, names: string[]): string {
  const full = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
  let out = text;
  for (const n of full) out = out.replace(new RegExp(escape(n), 'gi'), REDACTED);

  const lower = full.map((n) => n.toLowerCase());
  out = out.replace(/(["“«„])([^"”»“]{3,}?)(["”»“])/g, (m, open, inner: string, close) => {
    const i = inner.trim().toLowerCase();
    return i.length >= 3 && lower.some((n) => n.includes(i)) ? `${open}${REDACTED}${close}` : m;
  });
  return out;
}

/** Splits card text into clue chunks (sentences / lines), dropping empty ones. */
export function splitClues(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9"“«(\[ÀÉÈÊÎÔÛÄÖÜÇ])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
