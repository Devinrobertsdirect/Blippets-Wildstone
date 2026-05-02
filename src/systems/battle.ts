import type { Blippet, MoveDef } from '../types/blippet';
import type {
  BattleAction, BattleEvent, BattleSide, BattleState, ResolvedTurn,
} from '../types/battle';
import { typeMultiplier } from '../data/types';
import { makeRng, rollChance, rollInt } from './rng';

export function createBattle(player: Blippet, enemy: Blippet, opts?: {
  isWild?: boolean; rngSeed?: number;
}): BattleState {
  return {
    player,
    enemy,
    turn: 1,
    isWild: opts?.isWild ?? true,
    rngSeed: opts?.rngSeed ?? Math.floor(Math.random() * 0x7fffffff),
    ended: false,
  };
}

function actor(state: BattleState, side: BattleSide): Blippet {
  return side === 'player' ? state.player : state.enemy;
}

function opposite(side: BattleSide): BattleSide {
  return side === 'player' ? 'enemy' : 'player';
}

function effectivenessLabel(mult: number): BattleEvent['kind'] | undefined {
  if (mult === 0) return 'no-effect';
  if (mult > 1) return 'super-effective';
  if (mult < 1) return 'not-very-effective';
  return undefined;
}

function calcDamage(
  attacker: Blippet, defender: Blippet, move: MoveDef, rng: () => number,
): { damage: number; mult: number; crit: boolean } {
  if (move.category === 'status' || move.power <= 0) {
    return { damage: 0, mult: 1, crit: false };
  }
  const atkStat = move.category === 'physical' ? attacker.stats.atk : attacker.stats.spAtk;
  const defStat = move.category === 'physical' ? defender.stats.def : defender.stats.spDef;
  const level = attacker.level;
  const base = Math.floor(((((2 * level) / 5 + 2) * move.power * (atkStat / Math.max(1, defStat))) / 50) + 2);

  const stab = attacker.species.types.includes(move.type) ? 1.5 : 1;
  const mult = typeMultiplier(move.type, defender.species.types);
  if (mult === 0) return { damage: 0, mult: 0, crit: false };

  const crit = rollChance(rng, 6.25);
  const critMult = crit ? 1.5 : 1;
  const variance = 0.85 + rng() * 0.15;

  const damage = Math.max(1, Math.floor(base * stab * mult * critMult * variance));
  return { damage, mult, crit };
}

function executeMove(
  state: BattleState, attackerSide: BattleSide, move: MoveDef, rng: () => number,
): BattleEvent[] {
  const events: BattleEvent[] = [];
  const attacker = actor(state, attackerSide);
  const defender = actor(state, opposite(attackerSide));
  const attackerName = attacker.nickname ?? attacker.species.name;

  events.push({ kind: 'message', side: attackerSide, text: `${attackerName} used ${move.name}!` });

  // PP cost
  if (attacker.movePP[move.id] !== undefined) {
    attacker.movePP[move.id] = Math.max(0, attacker.movePP[move.id] - 1);
  }

  // Accuracy
  if (move.accuracy < 100 && !rollChance(rng, move.accuracy)) {
    events.push({ kind: 'miss', side: attackerSide, text: `${attackerName}'s attack missed!` });
    return events;
  }

  const { damage, mult, crit } = calcDamage(attacker, defender, move, rng);

  if (mult === 0) {
    events.push({ kind: 'no-effect', text: `It had no effect...` });
    return events;
  }

  if (damage > 0) {
    defender.currentHP = Math.max(0, defender.currentHP - damage);
    events.push({ kind: 'damage', side: opposite(attackerSide), amount: damage });
    if (crit) events.push({ kind: 'critical', text: 'A critical hit!' });
    const fxLabel = effectivenessLabel(mult);
    if (fxLabel === 'super-effective') {
      events.push({ kind: 'super-effective', text: `It's super effective!` });
    } else if (fxLabel === 'not-very-effective') {
      events.push({ kind: 'not-very-effective', text: `It's not very effective...` });
    }
  }

  if (defender.currentHP === 0) {
    defender.status = 'fainted';
    const defName = defender.nickname ?? defender.species.name;
    events.push({ kind: 'faint', side: opposite(attackerSide), text: `${defName} fainted!` });
  }

  return events;
}

function pickFirst(state: BattleState, playerMove: MoveDef, enemyMove: MoveDef): BattleSide {
  if (state.player.stats.spd === state.enemy.stats.spd) {
    return Math.random() < 0.5 ? 'player' : 'enemy';
  }
  // priority moves could be handled here; for now pure speed.
  void playerMove; void enemyMove;
  return state.player.stats.spd >= state.enemy.stats.spd ? 'player' : 'enemy';
}

export function resolveTurn(
  state: BattleState, playerAction: BattleAction, enemyAction: BattleAction,
): ResolvedTurn {
  const events: BattleEvent[] = [];
  const rng = makeRng(state.rngSeed + state.turn * 1013904223);
  state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;

  if (state.ended) return { events, state };

  // RUN
  if (playerAction.kind === 'run') {
    if (state.isWild) {
      const fled = rollChance(rng, 75);
      if (fled) {
        state.ended = true;
        state.outcome = 'fled';
        events.push({ kind: 'message', text: 'Got away safely!' });
        return { events, state };
      }
      events.push({ kind: 'message', text: "Couldn't escape!" });
    } else {
      events.push({ kind: 'message', text: "Can't run from a trainer battle!" });
    }
  }

  // CAPTURE (only valid on wild)
  if (playerAction.kind === 'capture' && state.isWild) {
    const enemy = state.enemy;
    const hpRatio = enemy.currentHP / enemy.maxHP;
    const baseRate = 0.55;
    const rate = baseRate * (1 - hpRatio * 0.7);
    const success = rng() < Math.max(0.05, rate);
    events.push({ kind: 'capture-attempt', text: 'You hurled a Wildstone!' });
    if (success) {
      state.ended = true;
      state.outcome = 'caught';
      events.push({ kind: 'capture-success', text: `${enemy.species.name} was caught!` });
      return { events, state };
    }
    events.push({ kind: 'capture-fail', text: `${enemy.species.name} broke free!` });
    // enemy still gets a turn
  }

  // MOVE actions
  const playerMoveId = playerAction.moveId ?? state.player.moves[0].id;
  const enemyMoveId = enemyAction.moveId ?? state.enemy.moves[0].id;
  const playerMove = state.player.moves.find(m => m.id === playerMoveId)!;
  const enemyMove = state.enemy.moves.find(m => m.id === enemyMoveId)!;

  const goesFirst = pickFirst(state, playerMove, enemyMove);
  const order: { side: BattleSide; move: MoveDef }[] = goesFirst === 'player'
    ? [{ side: 'player', move: playerMove }, { side: 'enemy', move: enemyMove }]
    : [{ side: 'enemy', move: enemyMove }, { side: 'player', move: playerMove }];

  for (const step of order) {
    if (state.ended) break;
    const me = actor(state, step.side);
    if (me.status === 'fainted') continue;
    if (playerAction.kind === 'move' || step.side === 'enemy' || playerAction.kind === 'capture') {
      // capture+enemy turn flow: only enemy attacks if capture failed
      if (playerAction.kind === 'capture' && step.side === 'player') continue;
      if (playerAction.kind === 'run' && step.side === 'player') continue;
      const stepEvents = executeMove(state, step.side, step.move, rng);
      events.push(...stepEvents);
      if (state.player.currentHP === 0) {
        state.ended = true;
        state.outcome = 'loss';
        events.push({ kind: 'defeat', text: 'You have no Blippets left!' });
        break;
      }
      if (state.enemy.currentHP === 0) {
        state.ended = true;
        state.outcome = 'win';
        events.push({ kind: 'victory', text: 'You won the battle!' });
        break;
      }
    }
  }

  state.turn += 1;
  return { events, state };
}

// Convenience for AI / auto-battle: pick a random usable move.
export function pickRandomMove(b: Blippet): BattleAction {
  const usable = b.moves.filter(m => (b.movePP[m.id] ?? 0) > 0);
  const pool = usable.length > 0 ? usable : b.moves;
  const m = pool[rollInt(makeRng(Date.now() ^ b.species.dex), 0, pool.length - 1)];
  return { kind: 'move', moveId: m.id };
}
