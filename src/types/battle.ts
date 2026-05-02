import type { Blippet, MoveDef } from './blippet';

export type BattleSide = 'player' | 'enemy';

export type BattleEventKind =
  | 'message'
  | 'damage'
  | 'faint'
  | 'miss'
  | 'super-effective'
  | 'not-very-effective'
  | 'no-effect'
  | 'critical'
  | 'victory'
  | 'defeat'
  | 'capture-attempt'
  | 'capture-success'
  | 'capture-fail';

export interface BattleEvent {
  kind: BattleEventKind;
  side?: BattleSide;
  text?: string;
  amount?: number;
}

export interface BattleAction {
  kind: 'move' | 'switch' | 'item' | 'run' | 'capture';
  moveId?: string;
  itemId?: string;
}

export interface BattleState {
  player: Blippet;
  enemy: Blippet;
  turn: number;
  isWild: boolean;
  rngSeed: number;
  ended: boolean;
  outcome?: 'win' | 'loss' | 'caught' | 'fled';
}

export interface ResolvedTurn {
  events: BattleEvent[];
  state: BattleState;
}

export interface MoveExecution {
  attacker: BattleSide;
  move: MoveDef;
}
