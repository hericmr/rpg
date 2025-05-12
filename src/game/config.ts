import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import VideoScene from './scenes/VideoScene';
import GameScene from './scenes/GameScene';
import VarandaScene from './scenes/VarandaScene';
import { Types } from 'phaser';
import { GBC_COLORS } from './config/colors';

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 640,
  height: 480,
  pixelArt: true,
  backgroundColor: GBC_COLORS.BG_DARK,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 480,
    min: {
      width: 320,
      height: 240
    }
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
  scene: [BootScene, MenuScene, VideoScene, GameScene, VarandaScene]
}; 