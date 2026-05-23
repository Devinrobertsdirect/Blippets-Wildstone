import type { BlippetType } from '../types/blippet';

type ChartRow = Partial<Record<BlippetType, number>>;

const CHART: Record<BlippetType, ChartRow> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5, crystal: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2, crystal: 0.5 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5, crystal: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5, crystal: 2 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5, crystal: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5, crystal: 2 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2, crystal: 0 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2, crystal: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5, crystal: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5, crystal: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5, crystal: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0, crystal: 0.5 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5, crystal: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2, crystal: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5, crystal: 0.5 },
  // Crystal: refracts and binds magical energy. Resists psychic/fairy/ice.
  // Strong vs psychic, ghost, dragon, fairy. Weak vs ground, fighting, steel.
  crystal:  { psychic: 2, ghost: 2, dragon: 2, fairy: 2, fire: 0.5, ground: 0.5, fighting: 0.5, steel: 0.5, crystal: 0.5 },
};

export function typeMultiplier(attackType: BlippetType, defenderTypes: BlippetType[]): number {
  let mult = 1;
  for (const t of defenderTypes) {
    const v = CHART[attackType]?.[t];
    if (v !== undefined) mult *= v;
  }
  return mult;
}

export const TYPE_COLORS: Record<BlippetType, number> = {
  normal: 0xa8a878, fire: 0xf08030, water: 0x6890f0, grass: 0x78c850,
  electric: 0xf8d030, ice: 0x98d8d8, fighting: 0xc03028, poison: 0xa040a0,
  ground: 0xe0c068, flying: 0xa890f0, psychic: 0xf85888, bug: 0xa8b820,
  rock: 0xb8a038, ghost: 0x705898, dragon: 0x7038f8, dark: 0x705848,
  steel: 0xb8b8d0, fairy: 0xee99ac, crystal: 0xb86fd1,
};
