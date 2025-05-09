import { Scene, GameObjects, Physics } from 'phaser';
import { NPC } from '../scenes/BaseScene';
import { DialogBox } from '../components/DialogBox';

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
    private readonly interactionDistance: number = 50;

    constructor(scene: Scene) {
        this.scene = scene;
        this.npcs = new Map();
        this.configs = new Map();
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
        if (this.dialogActive || !this.scene.input.keyboard) return;

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
                    this.showDialog(config.dialog[npc.currentDialogIndex], {
                        portrait: config.spriteKey === 'lion' ? 'lionface' : undefined,
                        name: config.name,
                        color: 0xe43675
                    });
                    npc.currentDialogIndex = (npc.currentDialogIndex + 1) % config.dialog.length;
                }
                break;
            }
        }
    }

    private showDialog(
        dialog: string,
        options: {
            portrait?: string;
            name?: string;
            color?: number;
        } = {}
    ): void {
        if (this.dialogActive) return;

        this.dialogActive = true;
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        const x = screenWidth / 2;
        const y = screenHeight - (screenHeight * 0.15);

        this.currentDialog = new DialogBox({
            scene: this.scene,
            x,
            y,
            width: screenWidth * 0.9,
            height: screenHeight * 0.3,
            dialog,
            portrait: options.portrait,
            name: options.name,
            dialogColor: options.color ?? 0xe43675,
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
} 