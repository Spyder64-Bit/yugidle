import { COLUMNS, type Cell, type Row } from './compare.ts';

export function cellEmoji(c: Cell): string {
  if (c.status === 'hit') return '🟩';
  if (c.status === 'partial') return '🟨';
  if (c.arrow === 'up') return '⬆️';
  if (c.arrow === 'down') return '⬇️';
  return '🟥';
}

export const rowEmoji = (row: Row) => COLUMNS.map((c) => cellEmoji(row[c])).join('');

/** Max rows to include in a classic share before collapsing. */
const MAX_ROWS = 8;

export function classicGrid(rows: Row[]): string {
  if (rows.length <= MAX_ROWS) return rows.map(rowEmoji).join('\n');
  const head = rows.slice(0, MAX_ROWS - 2).map(rowEmoji);
  return [...head, `… +${rows.length - MAX_ROWS + 1}`, rowEmoji(rows[rows.length - 1])].join('\n');
}

/** One square per guess (all red but the last), wrapped every 10. */
export function simpleGrid(count: number): string {
  const squares = Array.from({ length: count }, (_, i) => (i === count - 1 ? '🟩' : '🟥'));
  const lines: string[] = [];
  for (let i = 0; i < squares.length; i += 10) lines.push(squares.slice(i, i + 10).join(''));
  return lines.join('\n');
}
