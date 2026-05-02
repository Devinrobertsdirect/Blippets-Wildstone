# Blippet sprites

Drop PNG illustrations here using the convention:

```
{spriteKey}.png
```

The `spriteKey` for each species is defined in `src/data/blippets.ts`. Current keys:

- `blippet-flamoo.png`
- `blippet-mosskit.png`
- `blippet-axoltule.png`
- `blippet-amerex.png`
- `blippet-silfing.png`

If a file is missing, the engine generates a colored placeholder using the
species' primary type color, so the game still runs.

## Recommended source format

- Square PNG (1024×1024 is fine — it's downscaled at render time)
- Transparent background preferred; solid background works but looks off in battle
