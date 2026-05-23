# Blippet sprites — drop your PNGs here

## Filename convention

```
{dex}_{slug}_{type1}[-{type2}].png
```

- `dex` — 3-digit zero-padded Pokédex number (`001`, `042`, `150`)
- `slug` — must match the `slug` column in `data/blippets.csv`
- `type1` / `type2` — must match the types in the CSV (validator cross-checks)

### Examples (the 5 starters)

```
001_flamoo_fire.png
002_mosskit_dark-grass.png
003_axoltule_water-crystal.png
004_amerex_psychic-crystal.png
005_silfing_water-dragon.png
```

## Optional variants

Same base name with an `@tag` suffix. Only added if the file exists — no
broken requests if you skip them.

```
003_axoltule_water-crystal@back.png    player-side back view (else front is flipped)
003_axoltule_water-crystal@icon.png    64×64 Pokédex icon (else front is downscaled)
003_axoltule_water-crystal@shiny.png   rare color variant
```

## Source format

- Square PNG. **512×512 recommended** (1024 works but bloats load time).
- Transparent background strongly preferred — solid backgrounds look boxy in battle.

## Noblip — the missing-art fallback (dex 000)

Two reserved files act as the universal stand-in (our MissingNo) shown for any
Blippet whose art file doesn't exist yet:

```
noblip.png         front view (winking)
noblip-back.png    player-side back view
```

Until these exist, the engine draws a procedural glitch sprite in their place,
so the game always runs. Drop the real PNGs here (512×512) and every art-less
Blippet immediately uses Noblip instead.

## After uploading

```bash
npm run validate    # confirms every file matches a CSV row and types line up
npm run dev
```

Missing art? Every such Blippet renders as **Noblip** (real art if present,
otherwise the procedural glitch). Keep original full-res art in
`assets-raw/blippets/`.
