import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { gameState } from '../state/game-state';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0e0e12);

    this.add.text(GAME_WIDTH / 2, 70, 'BLIPPETS', {
      fontFamily: 'monospace', fontSize: '40px', color: '#f2c14e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 110, 'WILDSTONE', {
      fontFamily: 'monospace', fontSize: '24px', color: '#e8e8ee',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 180, 'Press SPACE to start', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9aa0b4',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 210, 'Arrow keys to move • B for battle • A toggles auto', {
      fontFamily: 'monospace', fontSize: '10px', color: '#6e7388',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'v0.1 alpha', {
      fontFamily: 'monospace', fontSize: '10px', color: '#6e7388',
    }).setOrigin(0.5);

    const start = () => {
      if (!gameState.load()) gameState.startingParty();
      this.scene.start('Overworld');
    };

    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
  }
}
