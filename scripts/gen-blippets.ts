/*
 * Blippet data generator + validator.
 *
 *   npm run gen:blippets   -> validate, then write src/data/blippets.generated.ts
 *   npm run validate       -> validate only (no write); exits non-zero on error
 *
 * Source of truth: data/blippets.csv
 * Art convention:  public/blippets/{dex}_{slug}_{type1}[-{type2}].png
 *                  ...@back.png  ...@icon.png  ...@shiny.png  (optional)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVES } from '../src/data/moves';
import { TYPE_COLORS } from '../src/data/types';
import type { BlippetSpecies, BlippetType, LearnsetEntry, Rarity, SpeciesSprites } from '../src/types/blippet';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSV_PATH = resolve(ROOT, 'data/blippets.csv');
const ART_DIR = resolve(ROOT, 'public/blippets');
const OUT_PATH = resolve(ROOT, 'src/data/blippets.generated.ts');

const VALID_TYPES = new Set(Object.keys(TYPE_COLORS));
const VALID_RARITIES = new Set<Rarity>(['common', 'uncommon', 'rare', 'legendary']);
const VALID_MOVES = new Set(Object.keys(MOVES));

const checkOnly = process.argv.includes('--check');
const errors: string[] = [];
const warnings: string[] = [];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function parseLearnset(raw: string, slug: string): LearnsetEntry[] {
  if (!raw.trim()) return [];
  const out: LearnsetEntry[] = [];
  for (const part of raw.split(';')) {
    const [lvlStr, moveId] = part.split(':').map(s => s.trim());
    const level = Number(lvlStr);
    if (!moveId || !Number.isInteger(level)) {
      errors.push(`[${slug}] bad learnset entry "${part}" (expected level:moveId)`);
      continue;
    }
    if (level < 1 || level > 100) errors.push(`[${slug}] learnset level ${level} out of range 1-100`);
    if (!VALID_MOVES.has(moveId)) errors.push(`[${slug}] unknown move "${moveId}" — add it to src/data/moves.ts`);
    out.push({ level, moveId });
  }
  return out.sort((a, b) => a.level - b.level);
}

function variantPath(front: string, tag: string): string {
  return front.replace(/\.png$/, `@${tag}.png`);
}

function main(): void {
  if (!existsSync(CSV_PATH)) {
    console.error(`Missing ${CSV_PATH}`);
    process.exit(1);
  }
  const rows = parseCSV(readFileSync(CSV_PATH, 'utf8'));
  const header = rows[0].map(h => h.trim());
  const expected = ['dex', 'slug', 'name', 'type1', 'type2', 'hp', 'atk', 'def', 'spAtk', 'spDef', 'spd', 'rarity', 'abilities', 'learnset', 'evolves_into', 'evolve_level', 'description'];
  if (header.join(',') !== expected.join(',')) {
    console.error(`CSV header mismatch.\n  expected: ${expected.join(',')}\n  got:      ${header.join(',')}`);
    process.exit(1);
  }

  const artFiles = existsSync(ART_DIR)
    ? new Set(readdirSync(ART_DIR).filter(f => f.toLowerCase().endsWith('.png')))
    : new Set<string>();

  const seenDex = new Map<number, string>();
  const seenSlug = new Set<string>();
  const slugs = new Set<string>();
  const knownArt = new Set<string>();
  const species: BlippetSpecies[] = [];

  for (const row of rows.slice(1)) {
    const get = (k: string) => (row[expected.indexOf(k)] ?? '').trim();
    const slug = get('slug');
    if (!/^[a-z0-9-]+$/.test(slug)) { errors.push(`Invalid slug "${slug}" (lowercase letters, digits, hyphens only)`); continue; }
    if (seenSlug.has(slug)) errors.push(`Duplicate slug "${slug}"`);
    seenSlug.add(slug);
    slugs.add(slug);

    const dex = Number(get('dex'));
    if (!Number.isInteger(dex) || dex < 1) errors.push(`[${slug}] invalid dex "${get('dex')}"`);
    if (seenDex.has(dex)) errors.push(`Duplicate dex ${dex} (${seenDex.get(dex)} and ${slug})`);
    seenDex.set(dex, slug);

    const type1 = get('type1') as BlippetType;
    const type2raw = get('type2');
    if (!VALID_TYPES.has(type1)) errors.push(`[${slug}] unknown type1 "${type1}"`);
    if (type2raw && !VALID_TYPES.has(type2raw)) errors.push(`[${slug}] unknown type2 "${type2raw}"`);
    if (type2raw && type2raw === type1) errors.push(`[${slug}] type1 and type2 are identical`);
    const types = type2raw ? [type1, type2raw as BlippetType] : [type1];

    const num = (k: string) => {
      const v = Number(get(k));
      if (!Number.isFinite(v) || v <= 0) errors.push(`[${slug}] invalid stat ${k}="${get(k)}"`);
      return v;
    };
    const baseStats = {
      hp: num('hp'), atk: num('atk'), def: num('def'),
      spAtk: num('spAtk'), spDef: num('spDef'), spd: num('spd'),
    };

    const rarity = get('rarity') as Rarity;
    if (!VALID_RARITIES.has(rarity)) errors.push(`[${slug}] invalid rarity "${rarity}"`);

    const abilities = get('abilities').split(';').map(s => s.trim()).filter(Boolean);
    const learnset = parseLearnset(get('learnset'), slug);
    const movePool = [...new Set(learnset.map(e => e.moveId))];
    if (movePool.length === 0) warnings.push(`[${slug}] empty learnset — will fall back to a basic move`);

    const evoInto = get('evolves_into');
    const evoLevel = Number(get('evolve_level'));
    const evolution = evoInto ? { intoSlug: evoInto, level: evoLevel } : undefined;
    if (evoInto && (!Number.isInteger(evoLevel) || evoLevel < 1)) errors.push(`[${slug}] evolves_into set but evolve_level invalid`);

    const description = get('description');
    if (!description) warnings.push(`[${slug}] missing description`);

    const pad = String(dex).padStart(3, '0');
    const typePart = type2raw ? `${type1}-${type2raw}` : type1;
    const frontFile = `${pad}_${slug}_${typePart}.png`;
    knownArt.add(frontFile);
    for (const tag of ['back', 'icon', 'shiny']) knownArt.add(variantPath(frontFile, tag));
    const sprites: SpeciesSprites = {};
    if (artFiles.has(frontFile)) sprites.front = `blippets/${frontFile}`;
    else warnings.push(`[${slug}] no art yet — expected public/blippets/${frontFile} (placeholder will render)`);
    if (artFiles.has(variantPath(frontFile, 'back'))) sprites.back = `blippets/${variantPath(frontFile, 'back')}`;
    if (artFiles.has(variantPath(frontFile, 'icon'))) sprites.icon = `blippets/${variantPath(frontFile, 'icon')}`;
    if (artFiles.has(variantPath(frontFile, 'shiny'))) sprites.shiny = `blippets/${variantPath(frontFile, 'shiny')}`;

    species.push({
      dex, slug, name: get('name'), types, baseStats, rarity,
      abilities, learnset, movePool, evolution, description,
      spriteKey: `blippet-${slug}`, sprites,
    });
  }

  // Evolution targets (warn-only: future forms may not exist yet)
  for (const s of species) {
    if (s.evolution && !slugs.has(s.evolution.intoSlug)) {
      warnings.push(`[${s.slug}] evolves into "${s.evolution.intoSlug}" which has no CSV row yet`);
    }
  }

  // Orphan art (warn-only)
  for (const f of artFiles) {
    if (!knownArt.has(f)) warnings.push(`Orphan art file public/blippets/${f} (no matching CSV row)`);
  }

  for (const w of warnings) console.warn(`  warn: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`  ERROR: ${e}`);
    console.error(`\n${errors.length} error(s). Fix data/blippets.csv and re-run.`);
    process.exit(1);
  }

  species.sort((a, b) => a.dex - b.dex);
  console.log(`OK: ${species.length} Blippet(s) validated${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`);

  if (checkOnly) return;

  const body = JSON.stringify(species, null, 2);
  const out = `// AUTO-GENERATED by scripts/gen-blippets.ts — DO NOT EDIT.
// Source of truth: data/blippets.csv  (run: npm run gen:blippets)
import type { BlippetSpecies } from '../types/blippet';

export const SPECIES: BlippetSpecies[] = ${body};
`;
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, out, 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
}

main();
