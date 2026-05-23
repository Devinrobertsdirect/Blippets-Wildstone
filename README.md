# Blippets: Wildstone

A Pokémon-style creature collection + battle game. Built with TypeScript + Phaser 3 + Vite.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

## Controls

| Action | Key |
|---|---|
| Move | Arrow keys |
| Trigger test battle | `B` |
| Toggle auto-battle | `A` |
| Run from battle | `R` |
| Throw Wildstone (capture) | `C` |

Step through tall (dark) grass tiles for a chance at a wild encounter.

## Project layout

```
src/
  config.ts                  Game constants (resolution, colors, tile size)
  main.ts                    Phaser bootstrap
  types/                     TypeScript interfaces (Blippet, Move, Battle)
  data/
    blippets.ts              Re-exports generated species + lookup helpers
    blippets.generated.ts    AUTO-GENERATED from data/blippets.csv (do not edit)
    moves.ts                 Move definitions
    types.ts                 Type chart + colors (incl. custom Crystal type)
    test-map.ts              Hardcoded overworld tilemap
  systems/
    battle.ts                Pure-function turn resolver
    leveling.ts              XP curve, stat formula, Blippet factory
    ai.ts                    AI move picker (used by enemy + auto-battle)
    rng.ts                   Seeded PRNG
  state/
    game-state.ts            Party, Pokédex, save/load (localStorage)
  scenes/
    BootScene.ts             Bootstraps Phaser
    PreloadScene.ts          Loads art (or generates placeholders)
    TitleScene.ts            Title screen
    OverworldScene.ts        Walkable world
    BattleScene.ts           Battle UI + battle loop
public/
  blippets/                  Drop PNG sprites here (see README inside)
assets-raw/                  Original-quality source artwork (not shipped)
data/
  blippets.csv               Master roster — edit this, then `npm run gen:blippets`
scripts/
  gen-blippets.ts            CSV -> generated TS + validator
```

## Adding a new Blippet

The data is generated from a CSV — you never hand-edit TypeScript species records.

1. Add a row to `data/blippets.csv` (stats, types, learnset, evolution — see `data/README.md`)
2. Drop the art into `public/blippets/{dex}_{slug}_{type1}[-{type2}].png` (see `public/blippets/README.md`)
3. Run `npm run gen:blippets` (also runs automatically on `npm run dev`)

`npm run validate` checks the whole roster for typos, dupes, unknown moves, and
mismatched art before you commit.

## Architecture philosophy (carried from the Unity spec)

- **Data-driven:** species, moves, type chart all live in plain TS data files.
- **Pure battle simulator:** `resolveTurn(state, action) -> events` is side-effect-free and fully testable. Same engine powers manual play and auto-battle.
- **Auto-battle = swap input source:** enemy AI and auto-battle use the same `chooseAIMove` function — turning auto on routes the player's slot through it.
- **Scenes are isolated:** Boot -> Preload -> Title -> Overworld -> Battle. Payloads pass via `scene.start(name, data)`.
- **Save/load via localStorage** (Capacitor-ready for iOS wrap).
