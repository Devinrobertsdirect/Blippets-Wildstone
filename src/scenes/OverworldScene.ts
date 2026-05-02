import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../config';
import { isBlocked, isTallGrass, MAP_HEIGHT, MAP_WIDTH, TEST_MAP } from '../data/test-map';
import { gameState } from '../state/game-state';
import { SPECIES, getSpecies } from '../data/blippets';
import { instantiate } from '../systems/leveling';

const TILE_KEYS: Record<number, string> = {
  0: 'tile-grass',
  1: 'tile-path',
  2: 'tile-grass-tall',
  3: 'tile-tree',
  4: 'tile-rock',
  5: 'tile-water',
};

const ENCOUNTER_CHANCE = 0.18;

export class OverworldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private playerTile = { x: 4, y: 5 };
  private moving = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private hud!: Phaser.GameObjects.Container;
  private hudText!: Phaser.GameObjects.Text;
  private partyText!: Phaser.GameObjects.Text;

  constructor() { super('Overworld'); }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0e0e12);

    // Tilemap as a grid of images.
    const mapPixelW = MAP_WIDTH * TILE_SIZE;
    const mapPixelH = MAP_HEIGHT * TILE_SIZE;
    const offsetX = Math.floor((GAME_WIDTH - mapPixelW) / 2);
    const offsetY = Math.floor((GAME_HEIGHT - mapPixelH) / 2);

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const id = TEST_MAP[y][x];
        // Always paint a base grass tile under non-grass types so edges look clean.
        if (id !== 0) {
          this.add.image(offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE, 'tile-grass').setOrigin(0);
        }
        this.add.image(offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE, TILE_KEYS[id]).setOrigin(0);
      }
    }

    this.player = this.add.image(
      offsetX + this.playerTile.x * TILE_SIZE + 1,
      offsetY + this.playerTile.y * TILE_SIZE,
      'player',
    ).setOrigin(0).setDepth(10);

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.input.keyboard!.on('keydown-B', () => this.startTestBattle());
    this.input.keyboard!.on('keydown-A', () => {
      gameState.autoBattle = !gameState.autoBattle;
      this.refreshHUD();
    });

    // HUD
    this.hud = this.add.container(0, 0).setDepth(100);
    const hudBg = this.add.rectangle(0, 0, GAME_WIDTH, 40, 0x0e0e12, 0.85).setOrigin(0);
    hudBg.setStrokeStyle(1, 0x2a2d3a);
    this.hud.add(hudBg);
    this.hudText = this.add.text(8, 6, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#e8e8ee',
    });
    this.partyText = this.add.text(8, 22, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#9aa0b4',
    });
    this.hud.add(this.hudText);
    this.hud.add(this.partyText);
    this.refreshHUD();

    // Save the world position offsets for movement math.
    (this.player as Phaser.GameObjects.Image & { _offsetX: number; _offsetY: number })._offsetX = offsetX;
    (this.player as Phaser.GameObjects.Image & { _offsetX: number; _offsetY: number })._offsetY = offsetY;
  }

  update(): void {
    if (this.moving) return;
    let dx = 0, dy = 0;
    if (this.cursors.left?.isDown) dx = -1;
    else if (this.cursors.right?.isDown) dx = 1;
    else if (this.cursors.up?.isDown) dy = -1;
    else if (this.cursors.down?.isDown) dy = 1;
    if (dx === 0 && dy === 0) return;

    const nx = this.playerTile.x + dx;
    const ny = this.playerTile.y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_WIDTH || ny >= MAP_HEIGHT) return;
    if (isBlocked(TEST_MAP[ny][nx])) return;

    this.moving = true;
    const off = this.player as Phaser.GameObjects.Image & { _offsetX: number; _offsetY: number };
    this.tweens.add({
      targets: this.player,
      x: off._offsetX + nx * TILE_SIZE + 1,
      y: off._offsetY + ny * TILE_SIZE,
      duration: 130,
      onComplete: () => {
        this.playerTile.x = nx;
        this.playerTile.y = ny;
        this.moving = false;
        if (isTallGrass(TEST_MAP[ny][nx]) && Math.random() < ENCOUNTER_CHANCE) {
          this.triggerWildEncounter();
        }
      },
    });
  }

  private refreshHUD(): void {
    const active = gameState.activeBlippet();
    const auto = gameState.autoBattle ? 'ON' : 'OFF';
    const stones = gameState.wildstones;
    this.hudText.setText(`Wildstones: ${stones}    Auto-Battle: ${auto}    [A] toggle    [B] test battle`);
    if (active) {
      const hpPct = Math.round((active.currentHP / active.maxHP) * 100);
      this.partyText.setText(`Active: ${active.species.name} Lv${active.level}  HP ${active.currentHP}/${active.maxHP} (${hpPct}%)`);
    } else {
      this.partyText.setText('No active Blippet');
    }
  }

  private triggerWildEncounter(): void {
    const wildSpecies = SPECIES[Math.floor(Math.random() * SPECIES.length)];
    const wild = instantiate(wildSpecies, 3 + Math.floor(Math.random() * 4));
    gameState.markSeen(wildSpecies);
    this.scene.start('Battle', { wild, isWild: true });
  }

  private startTestBattle(): void {
    // Always pick a different species from your active Blippet for variety.
    const active = gameState.activeBlippet();
    const candidates = SPECIES.filter(s => s.slug !== active?.species.slug);
    const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? getSpecies('mosskit');
    const wild = instantiate(pick, 5);
    gameState.markSeen(pick);
    this.scene.start('Battle', { wild, isWild: true });
  }
}
