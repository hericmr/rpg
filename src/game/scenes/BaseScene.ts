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

export class BaseScene extends Scene {
  protected playerController!: PlayerController;
  protected npcController!: NPCController;
  protected interactionController!: InteractionController;
  protected dialogActive: boolean = false;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.npcController = new NPCController(this);
  }

  create(): void {
    this.tryInitializeInteractionController();
  }

  protected tryInitializeInteractionController(): void {
    if (!this.interactionController || !this.input?.keyboard) {
      // If keyboard is not available yet, retry after a short delay
      this.time.delayedCall(100, () => this.tryInitializeInteractionController());
      return;
    }

    // Try to initialize
    this.interactionController.init();
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
    // Create the InteractionController after PlayerController is initialized
    this.interactionController = new InteractionController(this, this.playerController);
  }

  protected setupNPCs(): void {
    // NPCController is already initialized in constructor
    // Child classes should override this method to add specific NPCs
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