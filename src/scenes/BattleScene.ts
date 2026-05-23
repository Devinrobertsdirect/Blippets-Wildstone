import Phaser from 'phaser';
import type { Blippet } from '../types/blippet';
import type { BattleAction, BattleEvent, BattleState } from '../types/battle';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { TYPE_COLORS } from '../data/types';
import { createBattle, resolveTurn } from '../systems/battle';
import { chooseAIMove } from '../systems/ai';
import { gameState } from '../state/game-state';
import { gainXP, xpFromDefeat } from '../systems/leveling';

interface BattleSceneData {
  wild: Blippet;
  isWild: boolean;
}

export class BattleScene extends Phaser.Scene {
  private state!: BattleState;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;

  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;

  private enemyHpBar!: Phaser.GameObjects.Rectangle;

  private dialogText!: Phaser.GameObjects.Text;
  private menuContainer!: Phaser.GameObjects.Container;
  private moveButtons: Phaser.GameObjects.Container[] = [];
  private autoBadge!: Phaser.GameObjects.Text;

  private busy = false;
  private eventQueue: BattleEvent[] = [];
  private playerMaxHP = 1;
  private enemyMaxHP = 1;

  constructor() { super('Battle'); }

  init(data: BattleSceneData): void {
    const player = gameState.activeBlippet();
    if (!player) {
      this.scene.start('Overworld');
      return;
    }
    this.state = createBattle(player, data.wild, { isWild: data.isWild });
    this.playerMaxHP = player.maxHP;
    this.enemyMaxHP = data.wild.maxHP;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x183a4a);

    // Battle stage backdrop
    const groundY = GAME_HEIGHT - 110;
    this.add.rectangle(0, 0, GAME_WIDTH, groundY, 0x9bc6d8).setOrigin(0);
    this.add.rectangle(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY, 0x6a8c5b).setOrigin(0);

    // Enemy platform + sprite
    this.add.ellipse(GAME_WIDTH - 110, groundY + 18, 130, 30, 0x4d6a3c, 0.55);
    this.enemySprite = this.add.image(GAME_WIDTH - 110, groundY - 30, this.state.enemy.species.spriteKey)
      .setOrigin(0.5)
      .setDisplaySize(110, 110);

    // Player platform + sprite (use dedicated back-view art if present, else flip the front).
    this.add.ellipse(110, GAME_HEIGHT - 70, 150, 36, 0x4d6a3c, 0.55);
    const backKey = `${this.state.player.species.spriteKey}-back`;
    const hasBack = this.textures.exists(backKey);
    this.playerSprite = this.add.image(110, GAME_HEIGHT - 95,
      hasBack ? backKey : this.state.player.species.spriteKey)
      .setOrigin(0.5)
      .setDisplaySize(130, 130)
      .setFlipX(!hasBack);

    // Enemy HUD card
    this.drawEnemyCard();
    // Player HUD card
    this.drawPlayerCard();

    // Dialog box
    const dialogBg = this.add.rectangle(0, GAME_HEIGHT - 60, GAME_WIDTH, 60, 0x0e0e12, 0.9).setOrigin(0);
    dialogBg.setStrokeStyle(1, 0xe8e8ee);
    this.dialogText = this.add.text(12, GAME_HEIGHT - 52, 'A wild Blippet appeared!', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      wordWrap: { width: GAME_WIDTH - 24 },
    });

    // Action menu (move buttons)
    this.menuContainer = this.add.container(0, 0);
    this.drawMoveMenu();

    // Auto-battle badge (top-right)
    this.autoBadge = this.add.text(GAME_WIDTH - 8, 8, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#f2c14e',
    }).setOrigin(1, 0);
    this.refreshAutoBadge();

    // Hotkeys
    this.input.keyboard!.on('keydown-A', () => {
      gameState.autoBattle = !gameState.autoBattle;
      this.refreshAutoBadge();
      if (gameState.autoBattle && !this.busy && !this.state.ended) {
        this.runAutoTurn();
      }
    });
    this.input.keyboard!.on('keydown-R', () => this.takeAction({ kind: 'run' }));
    this.input.keyboard!.on('keydown-C', () => this.takeAction({ kind: 'capture' }));

    // If auto starts on, kick off immediately
    if (gameState.autoBattle) {
      this.time.delayedCall(500, () => this.runAutoTurn());
    }
  }

  private drawEnemyCard(): void {
    const x = 16, y = 16, w = 180, h = 50;
    const card = this.add.rectangle(x, y, w, h, 0x1d1f2a, 0.92).setOrigin(0);
    card.setStrokeStyle(1, 0xe8e8ee);
    void card;

    const enemy = this.state.enemy;
    this.add.text(x + 8, y + 6,
      `${enemy.species.name}  Lv${enemy.level}`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', fontStyle: 'bold' });

    // Type badges
    let bx = x + 8;
    const by = y + 22;
    for (const t of enemy.species.types) {
      const badge = this.add.rectangle(bx, by, 36, 10, TYPE_COLORS[t]).setOrigin(0);
      this.add.text(bx + 18, by + 5, t.toUpperCase(),
        { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' }).setOrigin(0.5);
      bx += 40;
      void badge;
    }

    // HP bar
    const barX = x + 8, barY = y + 38, barW = w - 16, barH = 6;
    this.add.rectangle(barX, barY, barW, barH, 0x000000).setOrigin(0);
    this.enemyHpBar = this.add.rectangle(barX, barY, barW, barH, 0x4caf50).setOrigin(0);
  }

  private drawPlayerCard(): void {
    const w = 200, h = 60;
    const x = GAME_WIDTH - w - 16, y = GAME_HEIGHT - 130;
    const card = this.add.rectangle(x, y, w, h, 0x1d1f2a, 0.92).setOrigin(0);
    card.setStrokeStyle(1, 0xe8e8ee);
    void card;

    const p = this.state.player;
    this.add.text(x + 8, y + 6,
      `${p.nickname ?? p.species.name}  Lv${p.level}`,
      { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', fontStyle: 'bold' });

    // HP bar
    const barX = x + 8, barY = y + 26, barW = w - 16, barH = 6;
    this.add.rectangle(barX, barY, barW, barH, 0x000000).setOrigin(0);
    this.playerHpBar = this.add.rectangle(barX, barY, barW, barH, 0x4caf50).setOrigin(0);

    this.playerHpText = this.add.text(x + 8, y + 38,
      `HP ${p.currentHP}/${p.maxHP}`,
      { fontFamily: 'monospace', fontSize: '10px', color: '#e8e8ee' });
  }

  private drawMoveMenu(): void {
    this.moveButtons.forEach(b => b.destroy());
    this.moveButtons = [];

    const moves = this.state.player.moves;
    const cols = 2, rows = 2;
    const w = 110, h = 22;
    const startX = GAME_WIDTH - (cols * (w + 6)) - 8;
    const startY = GAME_HEIGHT - 60 - (rows * (h + 4)) - 4;

    for (let i = 0; i < Math.min(4, moves.length); i++) {
      const m = moves[i];
      const col = i % cols, row = Math.floor(i / cols);
      const bx = startX + col * (w + 6);
      const by = startY + row * (h + 4);

      const container = this.add.container(bx, by);
      const bg = this.add.rectangle(0, 0, w, h, 0x1d1f2a, 0.95).setOrigin(0);
      bg.setStrokeStyle(1, TYPE_COLORS[m.type]);
      bg.setInteractive({ useHandCursor: true });
      const label = this.add.text(6, 4,
        `${m.name}  ${this.state.player.movePP[m.id]}/${m.pp}`,
        { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff' });

      bg.on('pointerover', () => bg.setFillStyle(0x2a2d3a, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x1d1f2a, 0.95));
      bg.on('pointerdown', () => this.takeAction({ kind: 'move', moveId: m.id }));

      container.add([bg, label]);
      this.menuContainer.add(container);
      this.moveButtons.push(container);
    }

    // Run / Capture
    const utilY = startY + 2 * (h + 4) + 6;
    const runBtn = this.makeUtilButton(startX, utilY, 'Run [R]', 0x705848,
      () => this.takeAction({ kind: 'run' }));
    const capBtn = this.makeUtilButton(startX + 116, utilY, `Wildstone [C] (${gameState.wildstones})`, 0xe53935,
      () => this.takeAction({ kind: 'capture' }));
    this.menuContainer.add([runBtn, capBtn]);
  }

  private makeUtilButton(x: number, y: number, text: string, color: number, onClick: () => void) {
    const w = 110, h = 18;
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x1d1f2a, 0.95).setOrigin(0);
    bg.setStrokeStyle(1, color);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x2a2d3a, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x1d1f2a, 0.95));
    bg.on('pointerdown', onClick);
    const label = this.add.text(6, 3, text,
      { fontFamily: 'monospace', fontSize: '9px', color: '#ffffff' });
    c.add([bg, label]);
    return c;
  }

  private refreshAutoBadge(): void {
    this.autoBadge.setText(`AUTO-BATTLE: ${gameState.autoBattle ? 'ON' : 'OFF'}  [A]`);
    this.autoBadge.setColor(gameState.autoBattle ? '#4caf50' : '#9aa0b4');
  }

  private hpColor(ratio: number): number {
    if (ratio > 0.5) return 0x4caf50;
    if (ratio > 0.2) return 0xf2c14e;
    return 0xe53935;
  }

  private refreshHPBars(): void {
    const p = this.state.player;
    const e = this.state.enemy;
    const pRatio = Math.max(0, p.currentHP / this.playerMaxHP);
    const eRatio = Math.max(0, e.currentHP / this.enemyMaxHP);
    this.playerHpBar.width = (200 - 16) * pRatio;
    this.playerHpBar.fillColor = this.hpColor(pRatio);
    this.playerHpText.setText(`HP ${p.currentHP}/${p.maxHP}`);
    this.enemyHpBar.width = (180 - 16) * eRatio;
    this.enemyHpBar.fillColor = this.hpColor(eRatio);
  }

  private takeAction(playerAction: BattleAction): void {
    if (this.busy || this.state.ended) return;
    if (playerAction.kind === 'capture' && gameState.wildstones <= 0) {
      this.dialogText.setText('Out of Wildstones!');
      return;
    }
    if (playerAction.kind === 'capture') gameState.wildstones -= 1;

    const enemyAction = chooseAIMove(this.state.enemy, this.state.player);
    const { events } = resolveTurn(this.state, playerAction, enemyAction);
    this.eventQueue = events;
    this.busy = true;
    this.playEvents();
  }

  private runAutoTurn(): void {
    if (this.busy || this.state.ended) return;
    const playerAction = chooseAIMove(this.state.player, this.state.enemy);
    this.takeAction(playerAction);
  }

  private playEvents(): void {
    if (this.eventQueue.length === 0) {
      this.busy = false;
      this.refreshHPBars();
      this.drawMoveMenu();
      if (this.state.ended) {
        this.handleEnd();
      } else if (gameState.autoBattle) {
        this.time.delayedCall(700, () => this.runAutoTurn());
      }
      return;
    }
    const ev = this.eventQueue.shift()!;
    this.applyEvent(ev);
    const delay = ev.kind === 'damage' ? 350 : ev.kind === 'message' ? 700 : 500;
    this.time.delayedCall(delay, () => this.playEvents());
  }

  private applyEvent(ev: BattleEvent): void {
    if (ev.text) this.dialogText.setText(ev.text);
    if (ev.kind === 'damage' && ev.side) {
      const target = ev.side === 'player' ? this.playerSprite : this.enemySprite;
      this.tweens.add({
        targets: target,
        x: target.x + (ev.side === 'player' ? -6 : 6),
        duration: 60,
        yoyo: true,
        repeat: 2,
      });
      target.setTint(0xff5555);
      this.time.delayedCall(220, () => target.clearTint());
      this.refreshHPBars();
    }
    if (ev.kind === 'faint' && ev.side) {
      const target = ev.side === 'player' ? this.playerSprite : this.enemySprite;
      this.tweens.add({ targets: target, alpha: 0, y: target.y + 30, duration: 500 });
    }
  }

  private handleEnd(): void {
    if (this.state.outcome === 'win') {
      const xp = xpFromDefeat(this.state.enemy, this.state.isWild);
      const { leveledUp, newLevel } = gainXP(this.state.player, xp);
      const msg = leveledUp
        ? `Gained ${xp} XP! Reached level ${newLevel}!`
        : `Gained ${xp} XP!`;
      this.dialogText.setText(msg);
    } else if (this.state.outcome === 'caught') {
      const caught = this.state.enemy;
      // Add a fresh instance to the party (so HP/PP reset cleanly).
      const wasNew = !gameState.caught.has(caught.species.slug);
      gameState.markCaught(caught.species);
      gameState.addToParty(caught);
      this.dialogText.setText(wasNew
        ? `${caught.species.name} added! New entry in the Pokédex.`
        : `${caught.species.name} added to your party.`);
    } else if (this.state.outcome === 'fled') {
      this.dialogText.setText('Got away safely!');
    } else if (this.state.outcome === 'loss') {
      this.dialogText.setText('You blacked out...');
      // Heal one HP so player isn't softlocked.
      if (this.state.player.currentHP === 0) this.state.player.currentHP = 1;
    }
    gameState.save();
    this.time.delayedCall(1800, () => this.scene.start('Overworld'));
  }
}
