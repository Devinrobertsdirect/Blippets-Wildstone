# Blippet data — the single source of truth

`blippets.csv` defines every Blippet. Edit it in a spreadsheet (Google Sheets /
Excel) or a text editor, then run:

```bash
npm run gen:blippets    # validate + regenerate src/data/blippets.generated.ts
npm run validate        # validate only (CI-friendly, no write)
```

`gen:blippets` also runs automatically before `npm run dev` and `npm run build`.

## Columns

| column        | example                                  | notes |
|---------------|------------------------------------------|-------|
| `dex`         | `1`                                      | unique Pokédex number |
| `slug`        | `flamoo`                                 | unique id; lowercase, digits, hyphens |
| `name`        | `Flamoo`                                 | display name |
| `type1`       | `fire`                                   | required; must be a valid type |
| `type2`       | `crystal`                                | optional; leave blank for single-type |
| `hp`…`spd`    | `55`                                     | base stats (hp, atk, def, spAtk, spDef, spd) |
| `rarity`      | `common`                                 | common / uncommon / rare / legendary |
| `abilities`   | `blaze;thick-hide`                       | semicolon-separated |
| `learnset`    | `1:tackle;7:flame-charge;13:headbutt`    | `level:moveId` pairs, semicolon-separated |
| `evolves_into`| `emburn`                                 | slug of the evolved form (optional) |
| `evolve_level`| `16`                                     | level it evolves at (optional) |
| `description` | `"A calf with a smoldering mane."`       | quote it if it contains a comma |

## Valid types (19)

`normal fire water grass electric ice fighting poison ground flying psychic bug
rock ghost dragon dark steel fairy crystal`

(`crystal` is the custom type.)

## Move IDs

Every `moveId` in a learnset must exist in `src/data/moves.ts`. The validator
errors on unknown moves, so add the move first.

## What the validator checks

- duplicate `dex` or `slug`
- unknown type, rarity, or move id
- non-positive / non-numeric stats
- learnset levels outside 1–100
- evolution target without a CSV row (warning — future forms allowed)
- art files present vs. expected (warning)
