import { Scene, Physics, Input } from 'phaser';
import { Player } from '../scenes/BaseScene';

export interface PlayerConfig {
    startX: number;
    startY: number;
    spriteKey: string;
    normalSpeed?: number;
    sprintSpeed?: number;
}

export class PlayerController {
    private scene: Scene;
    private player!: Player;
    private cursors: {
        left?: Input.Keyboard.Key;
        right?: Input.Keyboard.Key;
        up?: Input.Keyboard.Key;
        down?: Input.Keyboard.Key;
        shift?: Input.Keyboard.Key;
    } = {};
    private readonly NORMAL_SPEED: number;
    private readonly SPRINT_SPEED: number;
    private dialogActive: boolean = false;

    constructor(scene: Scene, config: PlayerConfig) {
        this.scene = scene;
        this.NORMAL_SPEED = config.normalSpeed ?? 100;
        this.SPRINT_SPEED = config.sprintSpeed ?? 200;
        
        this.setupPlayer(config);
        this.setupInput();
    }

    private setupPlayer(config: PlayerConfig): void {
        const sprite = this.scene.physics.add.sprite(config.startX, config.startY, config.spriteKey);
        sprite.setSize(12, 12);
        sprite.setOffset(2, 2);
        sprite.setScale(2);
        sprite.setData('type', 'player');

        this.player = {
            sprite,
            inventory: [],
            stats: {
                clearance: "Branco",
                implants: []
            }
        };
    }

    private setupInput(): void {
        if (!this.scene.input.keyboard) return;
        
        this.cursors = this.scene.input.keyboard.addKeys({
            left: Input.Keyboard.KeyCodes.LEFT,
            right: Input.Keyboard.KeyCodes.RIGHT,
            up: Input.Keyboard.KeyCodes.UP,
            down: Input.Keyboard.KeyCodes.DOWN,
            shift: Input.Keyboard.KeyCodes.SHIFT
        });
    }

    public update(): void {
        if (!this.player?.sprite || this.dialogActive) return;

        const speed = this.cursors.shift?.isDown ? this.SPRINT_SPEED : this.NORMAL_SPEED;
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left?.isDown) {
            velocityX = -speed;
            this.player.sprite.setFlipX(true);
        } else if (this.cursors.right?.isDown) {
            velocityX = speed;
            this.player.sprite.setFlipX(false);
        }

        if (this.cursors.up?.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down?.isDown) {
            velocityY = speed;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= Math.SQRT1_2;
            velocityY *= Math.SQRT1_2;
        }

        this.player.sprite.setVelocity(velocityX, velocityY);

        // Update animation
        if (velocityX !== 0 || velocityY !== 0) {
            this.player.sprite.anims.play('walk', true);
        } else {
            this.player.sprite.anims.play('idle', true);
        }
    }

    public setupCamera(mapWidth: number, mapHeight: number): void {
        this.scene.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.scene.cameras.main.startFollow(this.player.sprite);
        this.scene.cameras.main.setZoom(1);
        this.scene.cameras.main.setRoundPixels(true);
    }

    public setupCollisions(collidableLayers: Phaser.Tilemaps.TilemapLayer[]): void {
        collidableLayers.forEach(layer => {
            if (layer) {
                this.scene.physics.add.collider(this.player.sprite, layer);
            }
        });
    }

    public getPlayer(): Player {
        return this.player;
    }

    public setDialogActive(active: boolean): void {
        this.dialogActive = active;
        if (active) {
            this.player.sprite.setVelocity(0, 0);
        }
    }

    public isDialogActive(): boolean {
        return this.dialogActive;
    }
} 