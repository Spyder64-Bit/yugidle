/**
 * Backup codes: the whole saved state as one copy-pasteable string, so players can move their
 * progress to another device or restore it after clearing the browser. No account needed.
 */
const PREFIX = 'YUGIDLE1-';

export function encodeBackup(data: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return PREFIX + btoa(bin);
}

/** Returns the decoded object, or null if the code is not a valid Yugidle backup. */
export function decodeBackup(code: string): Record<string, unknown> | null {
  const s = code.replace(/\s+/g, '');
  if (!s.startsWith(PREFIX)) return null;
  try {
    const bin = atob(s.slice(PREFIX.length));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}
