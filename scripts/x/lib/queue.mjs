import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const QUEUE_PATH = path.join(ROOT, 'data/x/queue.json');
export const CONFIG_PATH = path.join(ROOT, 'data/x/config.json');
export const BRIEF_DIR = path.join(ROOT, 'data/x/briefs');

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export const readQueue = () => readJson(QUEUE_PATH, []);
export const writeQueue = (q) => writeJson(QUEUE_PATH, q);
export const readConfig = () =>
  readJson(CONFIG_PATH, { mode: 'approval', minIntervalMinutes: 120, expireAfterMinutes: 240, slots: {} });

/** 投稿済みを時系列で返す */
export const postedHistory = (queue) =>
  queue.filter((p) => p.status === 'posted').sort((a, b) => (a.postedAt || '').localeCompare(b.postedAt || ''));
