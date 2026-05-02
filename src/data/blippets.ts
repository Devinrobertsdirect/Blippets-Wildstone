import type { BlippetSpecies } from '../types/blippet';

export const SPECIES: BlippetSpecies[] = [
  {
    dex: 1,
    slug: 'flamoo',
    name: 'Flamoo',
    types: ['fire'],
    baseStats: { hp: 55, atk: 65, def: 45, spAtk: 40, spDef: 50, spd: 55 },
    rarity: 'common',
    abilities: ['blaze', 'thick-hide'],
    movePool: ['ember', 'tackle', 'flame-charge', 'headbutt'],
    evolution: { intoSlug: 'emburn', level: 16 },
    description: 'A calf with a smoldering mane. Warms its herd on cold nights.',
    spriteKey: 'blippet-flamoo',
  },
  {
    dex: 2,
    slug: 'mosskit',
    name: 'Mosskit',
    types: ['dark', 'grass'],
    baseStats: { hp: 50, atk: 55, def: 40, spAtk: 70, spDef: 55, spd: 75 },
    rarity: 'uncommon',
    abilities: ['leaf-veil', 'keen-eye'],
    movePool: ['scratch', 'razor-leaf', 'shadow-sneak', 'haze'],
    description: 'A shadow-dwelling kit cloaked in moss. Glides between branches.',
    spriteKey: 'blippet-mosskit',
  },
  {
    dex: 3,
    slug: 'axoltule',
    name: 'Axoltule',
    types: ['water', 'crystal'],
    baseStats: { hp: 75, atk: 50, def: 80, spAtk: 55, spDef: 75, spd: 30 },
    rarity: 'uncommon',
    abilities: ['sturdy', 'hydration'],
    movePool: ['water-gun', 'harden', 'mud-shot', 'crystal-shard'],
    description: 'A gentle axolotl that carries a crystal-encrusted shell drawn from cave pools.',
    spriteKey: 'blippet-axoltule',
  },
  {
    dex: 4,
    slug: 'amerex',
    name: 'Amerex',
    types: ['psychic', 'crystal'],
    baseStats: { hp: 60, atk: 75, def: 55, spAtk: 85, spDef: 60, spd: 65 },
    rarity: 'rare',
    abilities: ['prism-mind', 'crystal-armor'],
    movePool: ['confusion', 'crystal-shard', 'psybeam', 'prism-beam'],
    description: 'Floating amethysts orbit its skull, refracting its thoughts into raw force.',
    spriteKey: 'blippet-amerex',
  },
  {
    dex: 5,
    slug: 'silfing',
    name: 'Silfing',
    types: ['water', 'dragon'],
    baseStats: { hp: 65, atk: 60, def: 55, spAtk: 70, spDef: 70, spd: 60 },
    rarity: 'uncommon',
    abilities: ['torrent', 'serene-grace'],
    movePool: ['water-gun', 'dragon-breath', 'bubble-beam', 'twister'],
    description: 'A juvenile dragon of shallow lagoons. Hums when content.',
    spriteKey: 'blippet-silfing',
  },
];

const BY_SLUG = new Map(SPECIES.map(s => [s.slug, s]));
const BY_DEX = new Map(SPECIES.map(s => [s.dex, s]));

export function getSpecies(slug: string): BlippetSpecies {
  const s = BY_SLUG.get(slug);
  if (!s) throw new Error(`Unknown blippet slug: ${slug}`);
  return s;
}

export function getSpeciesByDex(dex: number): BlippetSpecies | undefined {
  return BY_DEX.get(dex);
}
