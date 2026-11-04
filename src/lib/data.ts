import { TEXT_SHARDS, type Lang, type Monster, type Schedule } from './types.ts';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const loadMonsters = () => getJson<Monster[]>('/data/monsters.json');
export const loadSchedule = () => getJson<Schedule>('/data/schedule.json');

const nameCache = new Map<Lang, Promise<Record<number, string>>>();
export function loadNames(lang: Lang): Promise<Record<number, string>> {
  if (lang === 'en') return Promise.resolve({});
  if (!nameCache.has(lang)) {
    const p = getJson<Record<number, string>>(`/data/names/${lang}.json`).catch((e) => {
      nameCache.delete(lang);
      throw e;
    });
    nameCache.set(lang, p);
  }
  return nameCache.get(lang)!;
}

const textCache = new Map<string, Promise<Record<number, string>>>();
/** Card text in `lang`, falling back to English. */
export async function loadText(lang: Lang, id: number): Promise<string> {
  const shard = async (l: Lang) => {
    const path = `/data/text/${l}/${id % TEXT_SHARDS}.json`;
    if (!textCache.has(path)) textCache.set(path, getJson<Record<number, string>>(path).catch(() => ({})));
    return (await textCache.get(path)!)[id];
  };
  return (await shard(lang)) ?? (await shard('en')) ?? '';
}

export const artUrl = (img: number) => `/img/art/${img}.webp`;
export const thumbUrl = (img: number) => `/thumbs/${img}.webp`;
