export type BlippetType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy' | 'crystal';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveDef {
  id: string;
  name: string;
  type: BlippetType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  description: string;
}

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  spd: number;
}

export interface Evolution {
  intoSlug: string;
  level: number;
}

export interface LearnsetEntry {
  level: number;
  moveId: string;
}

export interface SpeciesSprites {
  /** Battle front sprite path (relative to public/). Set only when the file exists. */
  front?: string;
  /** Player-side back view. Set only when the file exists. */
  back?: string;
  /** Pokedex/menu icon. Set only when the file exists. */
  icon?: string;
  /** Rare color variant. Set only when the file exists. */
  shiny?: string;
}

export interface BlippetSpecies {
  dex: number;
  slug: string;
  name: string;
  types: BlippetType[];
  baseStats: BaseStats;
  rarity: Rarity;
  abilities: string[];
  /** Moves learned by level. Source of truth for what a Blippet can know. */
  learnset: LearnsetEntry[];
  /** All unique move IDs in the learnset (derived). */
  movePool: string[];
  evolution?: Evolution;
  description: string;
  spriteKey: string;
  sprites: SpeciesSprites;
}

export interface Blippet {
  species: BlippetSpecies;
  level: number;
  xp: number;
  nickname?: string;
  currentHP: number;
  maxHP: number;
  stats: BaseStats;
  moves: MoveDef[];
  movePP: Record<string, number>;
  status?: 'fainted' | 'paralyzed' | 'burned' | 'poisoned' | 'asleep';
}
