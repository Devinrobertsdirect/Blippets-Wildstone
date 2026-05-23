/*
 * One-time roster scaffold. Fills data/blippets.csv up to dex 150 with
 * balanced placeholder rows so you only edit name/types and drop art.
 *
 *   npm run scaffold:csv
 *
 * SAFE: existing rows are preserved verbatim (matched by dex). Re-running only
 * adds rows for dex numbers that are still missing — it never overwrites your edits.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPE_COLORS } from '../src/data/types';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSV_PATH = resolve(ROOT, 'data/blippets.csv');
const MAX_DEX = 150;

const TYPES = Object.keys(TYPE_COLORS);

// A damaging move that exists in src/data/moves.ts, per type (for placeholder STAB).
const STAB: Record<string, string> = {
  fire: 'ember', water: 'water-gun', grass: 'razor-leaf', ghost: 'shadow-sneak',
  ground: 'mud-shot', rock: 'rock-throw', psychic: 'confusion', dragon: 'dragon-breath',
  crystal: 'crystal-shard', normal: 'tackle',
};

interface Archetype { name: string; w: [number, number, number, number, number, number]; }
const ARCHETYPES: Archetype[] = [
  { name: 'balanced', w: [1, 1, 1, 1, 1, 1] },
  { name: 'phys-sweeper', w: [0.9, 1.4, 0.8, 0.6, 0.8, 1.3] },
  { name: 'spec-sweeper', w: [0.9, 0.6, 0.85, 1.4, 0.95, 1.25] },
  { name: 'tank', w: [1.4, 0.95, 1.4, 0.7, 1.2, 0.5] },
  { name: 'wall', w: [1.35, 0.7, 1.3, 0.85, 1.4, 0.55] },
  { name: 'glass-cannon', w: [0.7, 1.5, 0.6, 1.35, 0.6, 1.45] },
];

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rarityFor(rng: () => number): { rarity: string; bst: number } {
  const r = rng();
  if (r < 0.55) return { rarity: 'common', bst: 300 };
  if (r < 0.85) return { rarity: 'uncommon', bst: 380 };
  if (r < 0.97) return { rarity: 'rare', bst: 455 };
  return { rarity: 'legendary', bst: 540 };
}

function placeholderRow(dex: number): string {
  const rng = mulberry32(dex * 2654435761);
  const pad = String(dex).padStart(3, '0');
  const slug = `blippet${pad}`;
  const name = `Blippet ${pad}`;

  const type1 = TYPES[dex % TYPES.length];
  const hasType2 = rng() < 0.35;
  let type2 = '';
  if (hasType2) {
    let t = TYPES[Math.floor(rng() * TYPES.length)];
    if (t === type1) t = TYPES[(TYPES.indexOf(t) + 1) % TYPES.length];
    type2 = t;
  }

  const arch = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length)];
  const { rarity, bst } = rarityFor(rng);
  const wSum = arch.w.reduce((a, b) => a + b, 0);
  const stats = arch.w.map(w => {
    const jitter = 0.92 + rng() * 0.16;
    return Math.max(15, Math.min(140, Math.round((w / wSum) * bst * jitter)));
  });
  const [hp, atk, def, spAtk, spDef, spd] = stats;

  const stab = STAB[type1];
  const learn = [
    stab ? `1:${stab}` : '1:tackle',
    '1:scratch',
    '7:headbutt',
  ].join(';');

  const abilities = 'adaptable;hardy';
  const description = `Unregistered Blippet. Replace name, types, and stats in data/blippets.csv.`;

  return [
    dex, slug, name, type1, type2, hp, atk, def, spAtk, spDef, spd,
    rarity, abilities, learn, '', '', `"${description}"`,
  ].join(',');
}

function main(): void {
  const raw = readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim() !== '');
  const header = lines[0];
  const existing = new Map<number, string>();
  for (const line of lines.slice(1)) {
    const dex = Number(line.split(',')[0]);
    if (Number.isInteger(dex)) existing.set(dex, line);
  }

  let added = 0;
  for (let dex = 1; dex <= MAX_DEX; dex++) {
    if (!existing.has(dex)) {
      existing.set(dex, placeholderRow(dex));
      added++;
    }
  }

  const ordered = [...existing.keys()].sort((a, b) => a - b).map(d => existing.get(d)!);
  writeFileSync(CSV_PATH, `${header}\n${ordered.join('\n')}\n`, 'utf8');
  console.log(`Scaffold complete: ${added} placeholder row(s) added, ${existing.size} total (dex 1-${MAX_DEX}).`);
}

main();
