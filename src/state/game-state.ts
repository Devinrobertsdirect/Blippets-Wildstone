import type { Blippet, BlippetSpecies } from '../types/blippet';
import { instantiate } from '../systems/leveling';
import { getSpecies } from '../data/blippets';

export interface SaveData {
  version: number;
  party: Array<{ slug: string; level: number; nickname?: string; currentHP: number; xp: number }>;
  pokedex: string[]; // slugs seen
  caught: string[];  // slugs caught
  coins: number;
  wildstones: number;
  autoBattle: boolean;
}

const SAVE_KEY = 'blippets-wildstone:save:v1';

export class GameState {
  party: Blippet[] = [];
  pokedex = new Set<string>();
  caught = new Set<string>();
  coins = 100;
  wildstones = 5;
  autoBattle = false;

  startingParty(): void {
    const starter = instantiate(getSpecies('flamoo'), 5);
    this.party = [starter];
    this.markSeen(starter.species);
    this.markCaught(starter.species);
  }

  activeBlippet(): Blippet | undefined {
    return this.party.find(b => b.currentHP > 0) ?? this.party[0];
  }

  markSeen(s: BlippetSpecies): void { this.pokedex.add(s.slug); }
  markCaught(s: BlippetSpecies): void {
    this.pokedex.add(s.slug);
    this.caught.add(s.slug);
  }

  addToParty(b: Blippet): void {
    if (this.party.length < 6) this.party.push(b);
    // box system later
  }

  save(): void {
    const data: SaveData = {
      version: 1,
      party: this.party.map(b => ({
        slug: b.species.slug, level: b.level, nickname: b.nickname,
        currentHP: b.currentHP, xp: b.xp,
      })),
      pokedex: [...this.pokedex],
      caught: [...this.caught],
      coins: this.coins,
      wildstones: this.wildstones,
      autoBattle: this.autoBattle,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as SaveData;
      this.party = data.party.map(p => {
        const b = instantiate(getSpecies(p.slug), p.level, p.nickname);
        b.currentHP = p.currentHP;
        b.xp = p.xp;
        return b;
      });
      this.pokedex = new Set(data.pokedex);
      this.caught = new Set(data.caught);
      this.coins = data.coins;
      this.wildstones = data.wildstones;
      this.autoBattle = data.autoBattle;
      return true;
    } catch { return false; }
  }
}

export const gameState = new GameState();
