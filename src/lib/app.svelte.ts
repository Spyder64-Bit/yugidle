import { dayIndex } from './daily.ts';
import { loadMonsters, loadNames, loadSchedule } from './data.ts';
import { TERMS, translate, type Key } from './i18n/index.ts';
import { SearchIndex } from './search.ts';
import { getSettings, saveSettings, type Settings } from './storage.ts';
import type { Lang, Monster, Schedule } from './types.ts';

class AppState {
  settings = $state<Settings>(getSettings());
  status = $state<'loading' | 'ready' | 'error'>('loading');
  monsters = $state.raw<Monster[]>([]);
  schedule = $state.raw<Schedule | null>(null);
  localNames = $state.raw<Record<number, string>>({});
  now = $state(Date.now());

  byId = $derived(new Map(this.monsters.map((m) => [m.id, m])));
  today = $derived(this.schedule ? dayIndex(this.schedule.epoch, this.now) : 0);
  terms = $derived(TERMS[this.settings.lang]);
  index = $derived(new SearchIndex(this.monsters, (m) => this.name(m)));

  t = (key: Key, params?: Record<string, string | number>) =>
    translate(this.settings.lang, key, params);

  name = (m: Monster) => this.localNames[m.id] ?? m.name;

  update(patch: Partial<Settings>) {
    Object.assign(this.settings, patch);
    saveSettings($state.snapshot(this.settings));
  }

  async setLang(lang: Lang) {
    try {
      this.localNames = await loadNames(lang);
    } catch {
      this.localNames = {};
    }
    this.update({ lang });
    document.documentElement.lang = lang;
  }

  async init() {
    try {
      const [monsters, schedule, names] = await Promise.all([
        loadMonsters(),
        loadSchedule(),
        loadNames(this.settings.lang).catch(() => ({})),
      ]);
      this.monsters = monsters;
      this.schedule = schedule;
      this.localNames = names;
      document.documentElement.lang = this.settings.lang;
      this.status = 'ready';
    } catch (e) {
      console.error(e);
      this.status = 'error';
    }
    setInterval(() => (this.now = Date.now()), 1000);
  }
}

export const app = new AppState();
