import type { Monster } from './types.ts';

/** Lowercase, strip accents and everything that isn't a letter or digit. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

interface Entry {
  id: number;
  pop: number;
  /** Normalized full names (localized + English). */
  keys: string[];
  /** Normalized name suffixes starting at each word boundary. */
  starts: string[];
}

function wordStarts(name: string): string[] {
  const words = name.split(/[\s\-–,.:;!?/"'()&]+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 1; i < words.length; i++) out.push(norm(words.slice(i).join('')));
  return out;
}

export class SearchIndex {
  private entries: Entry[];

  constructor(monsters: Monster[], localName: (m: Monster) => string) {
    this.entries = monsters.map((m) => {
      const names = [...new Set([localName(m), m.name])];
      return {
        id: m.id,
        pop: m.pop,
        keys: names.map(norm),
        starts: names.flatMap(wordStarts),
      };
    });
  }

  /** Returns up to `limit` ids: prefix matches, then word-start matches, then substring matches. */
  search(query: string, exclude: ReadonlySet<number>, limit = 8): number[] {
    const q = norm(query);
    if (!q) return [];
    const scored: { id: number; score: number; pop: number }[] = [];
    for (const e of this.entries) {
      if (exclude.has(e.id)) continue;
      let score = -1;
      if (e.keys.some((k) => k === q)) score = 0;
      else if (e.keys.some((k) => k.startsWith(q))) score = 1;
      else if (e.starts.some((k) => k.startsWith(q))) score = 2;
      else if (q.length >= 3 && e.keys.some((k) => k.includes(q))) score = 3;
      if (score >= 0) scored.push({ id: e.id, score, pop: e.pop });
    }
    scored.sort((a, b) => a.score - b.score || a.pop - b.pop);
    return scored.slice(0, limit).map((s) => s.id);
  }
}
