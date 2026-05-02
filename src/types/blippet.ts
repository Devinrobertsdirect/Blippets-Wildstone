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

export interface BlippetSpecies {
  dex: number;
  slug: string;
  name: string;
  types: BlippetType[];
  baseStats: BaseStats;
  rarity: Rarity;
  abilities: string[];
  movePool: string[];
  evolution?: Evolution;
  description: string;
  spriteKey: string;
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
