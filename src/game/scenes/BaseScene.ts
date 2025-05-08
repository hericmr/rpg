import { Scene, GameObjects, Physics, Input } from 'phaser';
import { DialogBox } from '../components/DialogBox';

export interface Player {
  sprite: Physics.Arcade.Sprite;
  inventory: string[];
  stats: {
    clearance: string;
    implants: string[];
  };
}

export interface NPC {
  sprite: GameObjects.Sprite;
  dialog: string[];
  currentDialogIndex: number;
  patrolPoints?: {x: number, y: number}[];
  currentPatrolIndex?: number;
  isMoving?: boolean;
  dialogBox?: {
    background: GameObjects.Rectangle;
    text: GameObjects.Text;
    border: GameObjects.Rectangle;
    innerBorder: GameObjects.Rectangle;
    outerBorder: GameObjects.Rectangle;
    faceImage?: GameObjects.Image;
    nameText: GameObjects.Text;
    timer?: Phaser.Time.TimerEvent;
  };
}

export abstract class BaseScene extends Scene {
  protected player!: Player;
  protected cursors: {
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
    shift?: Phaser.Input.Keyboard.Key;
  } = {};
  protected dialogActive: boolean = false;
  protected interactionPoints?: { x: number; y: number; dialog: string }[];
  protected currentDialog?: DialogBox;

  protected readonly NORMAL_SPEED = 100;
  protected readonly SPRINT_SPEED = 200;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  protected setupInput(): void {
    if (!this.input.keyboard) return;
    
    this.cursors = this.input.keyboard.addKeys({
      left: Input.Keyboard.KeyCodes.LEFT,
      right: Input.Keyboard.KeyCodes.RIGHT,
      up: Input.Keyboard.KeyCodes.UP,
      down: Input.Keyboard.KeyCodes.DOWN,
      shift: Input.Keyboard.KeyCodes.SHIFT
    });
  }

  protected setupPlayer(startX: number, startY: number): void {
    this.player = {
      sprite: this.physics.add.sprite(startX, startY, 'player'),
      inventory: [],
      stats: {
        clearance: "Branco",
        implants: []
      }
    };

    this.player.sprite.setSize(12, 12);
    this.player.sprite.setOffset(2, 2);
    this.player.sprite.setScale(2);
  }

  protected setupCamera(mapWidth: number, mapHeight: number): void {
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(true);
  }

  protected showDialog(dialog: string, isPlayerThought: boolean = false): void {
    if (this.dialogActive) return;

    this.dialogActive = true;
    this.player.sprite.setVelocity(0, 0);

    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const x = screenWidth / 2;
    const y = screenHeight - (screenHeight * 0.15);

    this.currentDialog = new DialogBox({
      scene: this,
      x: x,
      y: y,
      width: screenWidth * 0.9,
      height: screenHeight * 0.3,
      dialog: dialog,
      portrait: isPlayerThought ? 'player_portrait' : undefined,
      name: isPlayerThought ? 'Você' : undefined,
      dialogColor: isPlayerThought ? 0x1a237e : 0xe43675,
      textColor: '#FFFFFF',
      onClose: () => {
        this.dialogActive = false;
      }
    });
  }

  protected checkInteractions(): void {
    if (!this.input.keyboard || !this.interactionPoints) return;
    
    const spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    if (spaceKey.isDown) {
      this.checkInteractionPoints();
    }
  }

  protected checkInteractionPoints(): void {
    if (!this.interactionPoints) return;

    const playerBounds = this.player.sprite.getBounds();
    const interactionDistance = 50;

    for (const point of this.interactionPoints) {
      const distance = Phaser.Math.Distance.Between(
        playerBounds.centerX,
        playerBounds.centerY,
        point.x,
        point.y
      );

      if (distance <= interactionDistance) {
        this.showDialog(point.dialog, true);
        break;
      }
    }
  }

  protected handleMovement(): void {
    if (!this.player || this.dialogActive) return;

    const speed = this.cursors.shift?.isDown ? this.SPRINT_SPEED : this.NORMAL_SPEED;

    // Movimento horizontal
    if (this.cursors.left?.isDown) {
      this.player.sprite.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      this.player.sprite.setVelocityX(speed);
    } else {
      this.player.sprite.setVelocityX(0);
    }

    // Movimento vertical
    if (this.cursors.up?.isDown) {
      this.player.sprite.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      this.player.sprite.setVelocityY(speed);
    } else {
      this.player.sprite.setVelocityY(0);
    }
  }
} 