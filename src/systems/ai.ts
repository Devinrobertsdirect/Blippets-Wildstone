import type { Blippet } from '../types/blippet';
import type { BattleAction } from '../types/battle';
import { typeMultiplier } from '../data/types';

// Score each move by expected effectiveness vs the target, then pick the best.
export function chooseAIMove(self: Blippet, target: Blippet): BattleAction {
  const usable = self.moves.filter(m => (self.movePP[m.id] ?? 0) > 0);
  const pool = usable.length > 0 ? usable : self.moves;

  let best = pool[0];
  let bestScore = -Infinity;
  for (const m of pool) {
    const stab = self.species.types.includes(m.type) ? 1.5 : 1;
    const eff = typeMultiplier(m.type, target.species.types);
    const power = m.category === 'status' ? 5 : m.power;
    const acc = m.accuracy / 100;
    const score = power * stab * eff * acc + (Math.random() * 5);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return { kind: 'move', moveId: best.id };
}
