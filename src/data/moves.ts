import type { MoveDef } from '../types/blippet';

export const MOVES: Record<string, MoveDef> = {
  tackle: {
    id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical',
    power: 40, accuracy: 100, pp: 35,
    description: 'A full-body charge attack.',
  },
  scratch: {
    id: 'scratch', name: 'Scratch', type: 'normal', category: 'physical',
    power: 40, accuracy: 100, pp: 35,
    description: 'Rakes the foe with sharp claws.',
  },
  headbutt: {
    id: 'headbutt', name: 'Headbutt', type: 'normal', category: 'physical',
    power: 70, accuracy: 100, pp: 15,
    description: 'A strong headfirst charge.',
  },
  ember: {
    id: 'ember', name: 'Ember', type: 'fire', category: 'special',
    power: 40, accuracy: 100, pp: 25,
    description: 'A small flame attack that may burn.',
  },
  'flame-charge': {
    id: 'flame-charge', name: 'Flame Charge', type: 'fire', category: 'physical',
    power: 50, accuracy: 100, pp: 20,
    description: 'Cloaked in flame, raises Speed.',
  },
  'water-gun': {
    id: 'water-gun', name: 'Water Gun', type: 'water', category: 'special',
    power: 40, accuracy: 100, pp: 25,
    description: 'A jet of water blasts the foe.',
  },
  'bubble-beam': {
    id: 'bubble-beam', name: 'Bubble Beam', type: 'water', category: 'special',
    power: 65, accuracy: 100, pp: 20,
    description: 'A spray of bubbles. May lower Speed.',
  },
  'razor-leaf': {
    id: 'razor-leaf', name: 'Razor Leaf', type: 'grass', category: 'physical',
    power: 55, accuracy: 95, pp: 25,
    description: 'Sharp leaves slice the foe.',
  },
  'shadow-sneak': {
    id: 'shadow-sneak', name: 'Shadow Sneak', type: 'ghost', category: 'physical',
    power: 40, accuracy: 100, pp: 30,
    description: 'A priority strike from the shadows.',
  },
  haze: {
    id: 'haze', name: 'Haze', type: 'ice', category: 'status',
    power: 0, accuracy: 100, pp: 30,
    description: 'Resets all stat changes.',
  },
  harden: {
    id: 'harden', name: 'Harden', type: 'normal', category: 'status',
    power: 0, accuracy: 100, pp: 30,
    description: 'Stiffens the body. Raises Defense.',
  },
  'mud-shot': {
    id: 'mud-shot', name: 'Mud Shot', type: 'ground', category: 'special',
    power: 55, accuracy: 95, pp: 15,
    description: 'Hurled mud lowers Speed.',
  },
  'rock-tomb': {
    id: 'rock-tomb', name: 'Rock Tomb', type: 'rock', category: 'physical',
    power: 60, accuracy: 95, pp: 15,
    description: 'Boulders pin the foe and slow it.',
  },
  'rock-throw': {
    id: 'rock-throw', name: 'Rock Throw', type: 'rock', category: 'physical',
    power: 50, accuracy: 90, pp: 15,
    description: 'Hurls a rock at the target.',
  },
  confusion: {
    id: 'confusion', name: 'Confusion', type: 'psychic', category: 'special',
    power: 50, accuracy: 100, pp: 25,
    description: 'A weak telekinetic attack.',
  },
  psybeam: {
    id: 'psybeam', name: 'Psybeam', type: 'psychic', category: 'special',
    power: 65, accuracy: 100, pp: 20,
    description: 'A peculiar beam. May confuse.',
  },
  'ancient-power': {
    id: 'ancient-power', name: 'Ancient Power', type: 'rock', category: 'special',
    power: 60, accuracy: 100, pp: 5,
    description: 'A prehistoric force. May raise all stats.',
  },
  'dragon-breath': {
    id: 'dragon-breath', name: 'Dragon Breath', type: 'dragon', category: 'special',
    power: 60, accuracy: 100, pp: 20,
    description: 'A shockwave breath. May paralyze.',
  },
  twister: {
    id: 'twister', name: 'Twister', type: 'dragon', category: 'special',
    power: 40, accuracy: 100, pp: 20,
    description: 'A vicious tornado that may flinch.',
  },
  'crystal-shard': {
    id: 'crystal-shard', name: 'Crystal Shard', type: 'crystal', category: 'physical',
    power: 55, accuracy: 100, pp: 20,
    description: 'Hurls a faceted shard. High critical hit rate.',
  },
  'prism-beam': {
    id: 'prism-beam', name: 'Prism Beam', type: 'crystal', category: 'special',
    power: 70, accuracy: 95, pp: 10,
    description: 'A refracted beam of pure light. May lower Sp.Def.',
  },
};

export function getMove(id: string): MoveDef {
  const m = MOVES[id];
  if (!m) throw new Error(`Unknown move: ${id}`);
  return m;
}
