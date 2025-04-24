import GameScene from './scenes/GameScene';
import { Types } from 'phaser';
import { GBC_COLORS } from './config/colors';

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 240,  // Increased from 160
  height: 216, // Increased from 144
  pixelArt: true,
  backgroundColor: GBC_COLORS.BG_DARK,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 3, // Reduced zoom to compensate for larger base size
    width: 240,
    height: 216
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  scene: GameScene
}; 