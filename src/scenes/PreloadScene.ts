import Phaser from 'phaser';
import { SPECIES } from '../data/blippets';
import { TILE_SIZE } from '../config';

// Dex 000 "Noblip" — the universal fallback shown whenever a Blippet's art
// file doesn't exist yet (our MissingNo). Drop real art at:
//   public/blippets/noblip.png        (front, winking)
//   public/blippets/noblip-back.png   (back view)
// Until those exist, a procedural glitch sprite stands in.
const NOBLIP_KEY = 'noblip';
const NOBLIP_BACK_KEY = 'noblip-back';

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    // Optional on disk; loaderror below is silenced for these.
    this.load.image(NOBLIP_KEY, 'blippets/noblip.png');
    this.load.image(NOBLIP_BACK_KEY, 'blippets/noblip-back.png');

    // Real sprites; anything without art falls back to Noblip in create().
    // Variants are only requested when the generator confirmed the file exists.
    for (const s of SPECIES) {
      if (s.sprites.front) this.load.image(s.spriteKey, s.sprites.front);
      if (s.sprites.back) this.load.image(`${s.spriteKey}-back`, s.sprites.back);
      if (s.sprites.icon) this.load.image(`${s.spriteKey}-icon`, s.sprites.icon);
      if (s.sprites.shiny) this.load.image(`${s.spriteKey}-shiny`, s.sprites.shiny);
    }
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key === NOBLIP_KEY || file.key === NOBLIP_BACK_KEY) return; // expected until art is added
      console.warn(`[preload] missing asset: ${file.key} — using Noblip fallback`);
    });
  }

  create(): void {
    this.makeTileTextures();
    this.makePlayerTexture();

    const noblipReal = this.textures.exists(NOBLIP_KEY);
    const noblipBackReal = this.textures.exists(NOBLIP_BACK_KEY);
    if (!noblipReal) this.makeNoblipGlitch(NOBLIP_KEY, NOBLIP_KEY);

    // Route every Blippet missing front art to Noblip.
    for (const s of SPECIES) {
      if (this.textures.exists(s.spriteKey)) continue;
      if (noblipReal) {
        this.cloneTexture(NOBLIP_KEY, s.spriteKey);
        if (noblipBackReal) this.cloneTexture(NOBLIP_BACK_KEY, `${s.spriteKey}-back`);
      } else {
        // Per-species glitch so the dex looks corrupted-but-alive, MissingNo style.
        this.makeNoblipGlitch(s.spriteKey, s.spriteKey);
      }
    }

    this.scene.start('Title');
  }

  /** Register an existing image-backed texture under a second key (shared source). */
  private cloneTexture(srcKey: string, destKey: string): void {
    if (this.textures.exists(destKey)) return;
    const source = this.textures.get(srcKey).getSourceImage() as HTMLImageElement;
    this.textures.addImage(destKey, source);
  }

  private makeTileTextures(): void {
    const t = TILE_SIZE;
    const tiles: Array<[string, number, number?]> = [
      ['tile-grass', 0x6ec06f],
      ['tile-grass-tall', 0x2e7d32, 0x1b5e20],
      ['tile-path', 0xd4b483],
      ['tile-tree', 0x1f4d2a, 0x102818],
      ['tile-rock', 0x7a7a85, 0x4a4a55],
      ['tile-water', 0x3a78c2, 0x214a8c],
    ];
    for (const [key, c1, c2] of tiles) {
      const g = this.add.graphics({ x: 0, y: 0 });
      g.fillStyle(c1, 1).fillRect(0, 0, t, t);
      if (c2 !== undefined) {
        g.fillStyle(c2, 1);
        g.fillRect(2, 2, 4, 4);
        g.fillRect(t - 6, t - 6, 4, 4);
        g.fillRect(t - 6, 2, 3, 3);
        g.fillRect(2, t - 6, 3, 3);
      }
      g.lineStyle(1, 0x000000, 0.15).strokeRect(0, 0, t, t);
      g.generateTexture(key, t, t);
      g.destroy();
    }
  }

  private makePlayerTexture(): void {
    const w = TILE_SIZE - 2;
    const h = TILE_SIZE - 1;
    const g = this.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0x222a3a, 1).fillRoundedRect(0, 0, w, h, 3);
    g.fillStyle(0xf2c14e, 1).fillRect(3, 2, w - 6, 5); // hat brim
    g.fillStyle(0xffd9a8, 1).fillRect(3, 7, w - 6, 4); // face
    g.fillStyle(0x222a3a, 1).fillRect(3, h - 4, w - 6, 3); // legs
    g.generateTexture('player', w, h);
    g.destroy();
  }

  /** Procedural stand-in for Noblip: a glitchy, corrupted stack of slivers. */
  private makeNoblipGlitch(key: string, seed: string): void {
    const size = 96;
    const rand = mulberry32(hashString(seed));
    const body = [0xf4f3f8, 0xe7e3f2, 0xb8b0d8, 0x8a7fb5, 0x6f6394];
    const accent = [0xe0a06a, 0xd98c4f];
    const ink = 0x1a1626;

    const g = this.add.graphics({ x: 0, y: 0 });
    const left = 16;
    const right = size - 16;
    for (let y = 8; y < size - 8; y += 4) {
      const c = body[Math.floor(rand() * body.length)];
      const x0 = Math.max(4, left + Math.floor(rand() * 12) - 6);
      const w = Math.max(10, (right - left) - Math.floor(rand() * 18));
      g.fillStyle(c, 1).fillRect(x0, y, w, 3);
      if (rand() < 0.28) { // torn glitch gap
        g.fillStyle(ink, 1).fillRect(left + Math.floor(rand() * 44), y, 4 + Math.floor(rand() * 8), 3);
      }
      if (rand() < 0.16) { // warm fleck
        g.fillStyle(accent[Math.floor(rand() * accent.length)], 1)
          .fillRect(left + Math.floor(rand() * 56), y, 3, 3);
      }
    }
    // Jagged outline
    g.lineStyle(2, ink, 1).strokeRect(left - 3, 6, (right - left) + 6, size - 14);
    // Winking face hint: one open eye + one closed slit + grin
    g.fillStyle(ink, 1).fillRect(size / 2 - 16, size / 2 - 4, 6, 6); // open eye
    g.fillStyle(ink, 1).fillRect(size / 2 + 6, size / 2 - 2, 9, 2);  // wink
    g.fillStyle(ink, 1).fillRect(size / 2 - 10, size / 2 + 8, 16, 2); // grin
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
