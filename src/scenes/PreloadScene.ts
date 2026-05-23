import Phaser from 'phaser';
import { SPECIES } from '../data/blippets';
import { TYPE_COLORS } from '../data/types';
import { TILE_SIZE } from '../config';

// Generates placeholder textures so the game runs without uploaded art.
// When real PNGs are dropped into /public/blippets/<spriteKey>.png,
// we load them here and skip the placeholder for that key.
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload(): void {
    // Try real sprites; fall back to placeholders generated in create().
    // Variant textures are only requested when the generator confirmed the
    // file exists (sprites.back/icon/shiny), so we never fire dead 404s.
    for (const s of SPECIES) {
      if (s.sprites.front) this.load.image(s.spriteKey, s.sprites.front);
      if (s.sprites.back) this.load.image(`${s.spriteKey}-back`, s.sprites.back);
      if (s.sprites.icon) this.load.image(`${s.spriteKey}-icon`, s.sprites.icon);
      if (s.sprites.shiny) this.load.image(`${s.spriteKey}-shiny`, s.sprites.shiny);
    }
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[preload] missing asset: ${file.key} — using placeholder`);
    });
  }

  create(): void {
    this.makeTileTextures();
    this.makePlayerTexture();
    for (const s of SPECIES) {
      if (!this.textures.exists(s.spriteKey)) {
        this.makeBlippetPlaceholder(s.spriteKey, TYPE_COLORS[s.types[0]] ?? 0xcccccc, s.name);
      }
    }
    this.scene.start('Title');
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

  private makeBlippetPlaceholder(key: string, color: number, label: string): void {
    const size = 96;
    const g = this.add.graphics({ x: 0, y: 0 });
    g.fillStyle(0x0e0e12, 0).fillRect(0, 0, size, size);
    g.fillStyle(color, 1).fillCircle(size / 2, size / 2, size / 2 - 4);
    g.lineStyle(2, 0x000000, 0.5).strokeCircle(size / 2, size / 2, size / 2 - 4);
    g.generateTexture(key, size, size);
    g.destroy();

    // Render label as a separate texture we can compose if we want; not strictly needed.
    void label;
  }
}
