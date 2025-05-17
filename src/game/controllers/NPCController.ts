import { Scene, Physics } from 'phaser';
import { NPC } from '../scenes/BaseScene';
import { DialogBox } from '../components/DialogBox';
import { InteractionMenu } from '../components/InteractionMenu';
import { MenuManager } from '../components/menu/MenuManager';

export interface NPCConfig {
    id: string;
    name: string;
    spriteKey: string;
    position: { x: number; y: number };
    dialog: string[];
    patrolPoints?: { x: number; y: number }[];
    clearance?: string;
    implants?: string[];
}

export class NPCController {
    private scene: Scene;
    private npcs: Map<string, NPC>;
    private configs: Map<string, NPCConfig>;
    private dialogActive: boolean = false;
    private currentDialog?: DialogBox;
    private isInteracting: boolean = false;
    private isNPCAwake: boolean = false;
    private menuManager: MenuManager;
    private readonly interactionDistance: number = 50;

    constructor(scene: Scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.configs = new Map();
        this.menuManager = MenuManager.getInstance();
        this.menuManager.setScene(scene);
    }

    public addNPC(config: NPCConfig): void {
        this.configs.set(config.id, config);
        
        const npcSprite = this.scene.add.sprite(
            config.position.x,
            config.position.y,
            config.spriteKey
        );

        this.scene.physics.add.existing(npcSprite);
        
        if (npcSprite.body) {
            (npcSprite.body as Physics.Arcade.Body).setSize(8, 8);
            (npcSprite.body as Physics.Arcade.Body).setOffset(4, 4);
            (npcSprite.body as Physics.Arcade.Body).setImmovable(true);
        }
        
        npcSprite.setScale(2);

        const npc: NPC = {
            sprite: npcSprite,
            dialog: config.dialog,
            currentDialogIndex: 0,
            patrolPoints: config.patrolPoints,
            currentPatrolIndex: 0,
            isMoving: false
        };

        this.npcs.set(config.id, npc);
    }

    public update(): void {
        this.npcs.forEach(npc => {
            if (npc.sprite.texture.key === 'lion') return;
            if (!npc.isMoving && npc.patrolPoints) {
                this.moveNPC(npc);
            }
        });
    }

    public checkNPCInteractions(playerSprite: Physics.Arcade.Sprite): void {
        if (this.dialogActive || this.isInteracting || !this.scene.input.keyboard) return;

        const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        if (!spaceKey.isDown) return;

        const playerBounds = playerSprite.getBounds();

        for (const [id, npc] of this.npcs) {
            const distance = Phaser.Math.Distance.Between(
                playerBounds.centerX,
                playerBounds.centerY,
                npc.sprite.x,
                npc.sprite.y
            );

            if (distance <= this.interactionDistance) {
                const config = this.configs.get(id);
                if (config) {
                    console.log('[NPCController] Interação com NPC detectada:', config.name);
                    this.showInteractionMenu(config, npc);
                    return; // Garante que só um NPC seja interagido por vez
                }
            }
        }
    }

    private showInteractionMenu(config: NPCConfig, npc: NPC): void {
        console.log('[NPCController] Abrindo menu de interação para:', config.name);
        
        // Get menu position
        const position = {
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 60
        };

        // Show menu with NPC data
        this.menuManager.showMenu('npc', position, {
            config,
            npc,
            onLook: () => {
                this.menuManager.closeCurrentMenu();
                this.showDialog(`\n${config.name} está ${this.isNPCAwake ? 'acordado e irritado' : 'dormindo profundamente'}.`, {
                    portrait: config.spriteKey,
                    name: config.name,
                        color: 0x0d1642,
                        portraitScale: 2
                    });
            },
            onTalk: () => {
                this.menuManager.closeCurrentMenu();
                const dialogIndex = Math.floor(Math.random() * config.dialog.length);
                this.showDialog(config.dialog[dialogIndex], {
                    portrait: config.spriteKey,
                    name: config.name,
                        color: 0x0d1642,
                        portraitScale: 2
                    });
            },
            onHitNPC: () => {
                this.menuManager.closeCurrentMenu();
                this.showDialog(`\nVocê não vai bater no ${config.name}.\nEle é seu amigo, afinal de contas.`, {
                        portrait: 'heric',
                        name: 'Você',
                        color: 0x0d1642,
                        portraitScale: 2
                    });
            },
            onKick: () => {
                this.menuManager.closeCurrentMenu();
                this.showDialog(`\nVocê considera chutar ${config.name}, mas desiste no último momento. \nAfinal, ele é seu amigo...`, {
                        portrait: 'heric',
                        name: 'Você',
                        color: 0x0d1642,
                        portraitScale: 2
                    });
            }
        });
    }

    private showDialog(
        dialog: string,
        options: {
            portrait?: string;
            name?: string;
            color?: number;
            portraitScale?: number;
            autoClose?: boolean;
        } = {}
    ): void {
        if (this.dialogActive) return;

        this.dialogActive = true;
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        const x = screenWidth / 2;
        const y = screenHeight - 90;
        const width = screenWidth * 0.9;

        this.currentDialog = new DialogBox({
            scene: this.scene,
            x,
            y,
            width,
            height: 120,
            dialog,
            portrait: options.portrait || 'player_portrait',
            portraitScale: options.portraitScale || 2,
            name: options.name || 'Você',
            dialogColor: options.color ?? 0x0d1642,
            textColor: '#FFFFFF',
            onClose: () => {
                this.dialogActive = false;
                this.currentDialog = undefined;
            }
        });
    }

    private moveNPC(npc: NPC): void {
        if (!npc.patrolPoints || npc.currentPatrolIndex === undefined) return;

        npc.currentPatrolIndex = (npc.currentPatrolIndex + 1) % npc.patrolPoints.length;
        const target = npc.patrolPoints[npc.currentPatrolIndex];

        const moveHorizontally = () => {
            if (target.x !== npc.sprite.x) {
                this.scene.tweens.add({
                    targets: npc.sprite,
                    x: target.x,
                    duration: 1000,
                    ease: 'Linear',
                    onStart: () => {
                        npc.isMoving = true;
                        npc.sprite.setFlipX(target.x < npc.sprite.x);
                    },
                    onComplete: () => {
                        if (this.scene.scene.isActive()) {
                            moveVertically();
                        }
                    }
                });
            } else {
                moveVertically();
            }
        };

        const moveVertically = () => {
            if (target.y !== npc.sprite.y) {
                this.scene.tweens.add({
                    targets: npc.sprite,
                    y: target.y,
                    duration: 1000,
                    ease: 'Linear',
                    onComplete: () => {
                        if (this.scene.scene.isActive()) {
                            npc.isMoving = false;
                        }
                    }
                });
            } else {
                npc.isMoving = false;
            }
        };

        if (this.scene.scene.isActive()) {
            moveHorizontally();
        }
    }

    public getNPC(id: string): NPC | undefined {
        return this.npcs.get(id);
    }

    public getAllNPCs(): NPC[] {
        return Array.from(this.npcs.values());
    }

    public setupCollisions(collidableLayers: Phaser.Tilemaps.TilemapLayer[]): void {
        this.npcs.forEach(npc => {
            collidableLayers.forEach(layer => {
                if (layer) {
                    this.scene.physics.add.collider(npc.sprite, layer);
                }
            });
        });
    }

    public setupPlayerCollisions(playerSprite: Physics.Arcade.Sprite): void {
        this.npcs.forEach(npc => {
            this.scene.physics.add.collider(playerSprite, npc.sprite);
        });
    }

    public wakeUpAngry(): void {
        if (this.isNPCAwake) return;
        
        this.isNPCAwake = true;
        const lion = this.npcs.get('exec_1');
        if (lion) {
            // Mostrar diálogo de raiva
            this.showDialog('QUEM OUSOU ME ACORDAR COM ESSA MÚSICA?!?!?!', {
                color: 0x0d1642,
                autoClose: true
            });

            // Após um pequeno delay, mostrar outro diálogo
            this.scene.time.delayedCall(3000, () => {
                this.showDialog('Espera... essa música... LÉSBICA FUTURISTA?!?! COMO VOCÊ ACHOU ISSO?!', {
                    color: 0x0d1642,
                    autoClose: true
                });
            });
        }
    }

    public cleanupInteractionState(): void {
        this.isInteracting = false;
        this.menuManager.closeCurrentMenu();
    }
} 