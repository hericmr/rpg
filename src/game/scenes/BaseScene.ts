import { Scene, Physics } from 'phaser';
import { PlayerController } from '../controllers/PlayerController';
import { NPCController } from '../controllers/NPCController';
import InteractionController from '../controllers/InteractionController';

export interface Player {
  sprite: Physics.Arcade.Sprite;
  inventory: string[];
  stats: {
    clearance: string;
    implants: string[];
  };
  controller: PlayerController;
}

export interface NPC {
  sprite: Phaser.GameObjects.Sprite;
  dialog: string[];
  currentDialogIndex: number;
  patrolPoints?: {x: number, y: number}[];
  currentPatrolIndex?: number;
  isMoving?: boolean;
  dialogBox?: {
    background: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
    border: Phaser.GameObjects.Rectangle;
    innerBorder: Phaser.GameObjects.Rectangle;
    outerBorder: Phaser.GameObjects.Rectangle;
    faceImage?: Phaser.GameObjects.Image;
    nameText: Phaser.GameObjects.Text;
    timer?: Phaser.Time.TimerEvent;
  };
}

export abstract class BaseScene extends Scene {
  protected playerController!: PlayerController;
  protected npcController: NPCController;
  protected interactionController: InteractionController;
  protected dialogActive: boolean = false;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.npcController = new NPCController(this);
    this.interactionController = new InteractionController(this);
  }

  create(): void {
    // Try to initialize the interaction controller
    this.tryInitializeInteractionController();
  }

  protected tryInitializeInteractionController(): void {
    // Try to initialize
    this.interactionController.init();

    // If keyboard is not available yet, retry after a short delay
    if (!this.input?.keyboard) {
      this.time.delayedCall(100, () => this.tryInitializeInteractionController());
    }
  }

  protected setupPlayer(config: {
    startX: number;
    startY: number;
    spriteKey: string;
    normalSpeed?: number;
    sprintSpeed?: number;
    clearance?: string;
  }): void {
    this.playerController = new PlayerController(this, config);
  }

  protected setupNPCs(): void {
    this.npcController = new NPCController(this);
  }

  protected setupInteractions(): void {
    // This method should be overridden by child classes
  }

  protected setupCamera(mapWidth: number, mapHeight: number): void {
    this.playerController.setupCamera(mapWidth, mapHeight);
  }

  protected setupCollisions(collidableLayers: Phaser.Tilemaps.TilemapLayer[]): void {
    this.playerController.setupCollisions(collidableLayers);
    this.npcController.setupCollisions(collidableLayers);
    this.npcController.setupPlayerCollisions(this.playerController.getPlayer().sprite);
  }

  protected showDialog(
    dialog: string,
    options: {
      isPlayerThought?: boolean;
      portrait?: string;
      name?: string;
      dialogColor?: number;
    } = {}
  ): void {
    this.playerController.setDialogActive(true);
    this.interactionController.showDialog(dialog, options);
  }

  protected checkInteractions(): void {
    const player = this.playerController.getPlayer();
    this.interactionController.checkInteractions(
      player.sprite,
      player.stats.clearance
    );
    this.npcController.checkNPCInteractions(player.sprite);
  }

  protected handleMovement(): void {
    this.playerController.update();
  }

  protected updateNPCs(): void {
    this.npcController.update();
  }

  update(): void {
    this.handleMovement();
    this.checkInteractions();
    this.updateNPCs();
  }
} 