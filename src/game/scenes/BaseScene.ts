import { Scene, GameObjects, Physics, Input } from 'phaser';
import { DialogBox } from '../components/DialogBox';
import { PlayerController } from '../controllers/PlayerController';
import { NPCController } from '../controllers/NPCController';
import { InteractionController } from '../controllers/InteractionController';

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
  protected playerController!: PlayerController;
  protected npcController: NPCController;
  protected interactionController: InteractionController;
  protected dialogActive: boolean = false;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    this.npcController = new NPCController(this);
    this.interactionController = new InteractionController(this);
  }

  protected setupPlayer(config: {
    startX: number;
    startY: number;
    spriteKey: string;
    normalSpeed?: number;
    sprintSpeed?: number;
  }): void {
    this.playerController = new PlayerController(this, config);
  }

  protected setupNPCs(): void {
    this.npcController = new NPCController(this);
  }

  protected setupInteractions(): void {
    this.interactionController = new InteractionController(this);
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
      color?: number;
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