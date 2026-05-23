import type { BaseStats, Blippet, BlippetSpecies, MoveDef } from '../types/blippet';
import { getMove } from '../data/moves';

export function xpForLevel(level: number): number {
  return Math.floor((4 * level ** 3) / 5);
}

export function xpToNextLevel(currentLevel: number, currentXP: number): number {
  return Math.max(0, xpForLevel(currentLevel + 1) - currentXP);
}

export function computeStats(species: BlippetSpecies, level: number): BaseStats {
  const b = species.baseStats;
  const hp = Math.floor(((2 * b.hp) * level) / 100) + level + 10;
  const calc = (base: number) => Math.floor(((2 * base) * level) / 100) + 5;
  return {
    hp,
    atk: calc(b.atk),
    def: calc(b.def),
    spAtk: calc(b.spAtk),
    spDef: calc(b.spDef),
    spd: calc(b.spd),
  };
}

export function movesAtLevel(species: BlippetSpecies, level: number, max = 4): MoveDef[] {
  const learned = species.learnset
    .filter(e => e.level <= level)
    .sort((a, b) => a.level - b.level)
    .map(e => e.moveId);
  const unique = [...new Set(learned)];
  const chosen = unique.slice(-max); // keep the most recently learned moves
  if (chosen.length === 0) {
    const fallback = species.movePool[0] ?? 'tackle';
    return [getMove(fallback)];
  }
  return chosen.map(getMove);
}

export function instantiate(species: BlippetSpecies, level: number, nickname?: string): Blippet {
  const stats = computeStats(species, level);
  const moves = movesAtLevel(species, level);
  const movePP: Record<string, number> = {};
  for (const m of moves) movePP[m.id] = m.pp;
  return {
    species,
    level,
    xp: xpForLevel(level),
    nickname,
    currentHP: stats.hp,
    maxHP: stats.hp,
    stats,
    moves,
    movePP,
  };
}

export function gainXP(b: Blippet, amount: number): { leveledUp: boolean; newLevel: number } {
  b.xp += amount;
  let leveledUp = false;
  while (b.xp >= xpForLevel(b.level + 1) && b.level < 100) {
    b.level += 1;
    const newStats = computeStats(b.species, b.level);
    const hpDiff = newStats.hp - b.maxHP;
    b.maxHP = newStats.hp;
    b.currentHP = Math.min(b.maxHP, b.currentHP + Math.max(0, hpDiff));
    b.stats = newStats;
    leveledUp = true;
  }
  return { leveledUp, newLevel: b.level };
}

export function xpFromDefeat(defeated: Blippet, isWild: boolean): number {
  const base = 50;
  const wildMult = isWild ? 1 : 1.5;
  return Math.floor((base * defeated.level * wildMult) / 7);
}
