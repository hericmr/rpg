import { Scene, Input } from 'phaser';

interface Player {
    sprite: Phaser.Physics.Arcade.Sprite;
    direction: 'up' | 'down' | 'left' | 'right';
    isMoving: boolean;
    stats: {
        clearance: string;
    };
}

export interface PlayerConfig {
    startX: number;
    startY: number;
    spriteKey: string;
    normalSpeed?: number;
    sprintSpeed?: number;
    clearance?: string;
}

export class PlayerController {
    private scene: Scene;
    private player!: Player;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private readonly NORMAL_SPEED: number;
    private readonly SPRINT_SPEED: number;
    private dialogActive: boolean = false;
    private keyW: Phaser.Input.Keyboard.Key | undefined;
    private keyA: Phaser.Input.Keyboard.Key | undefined;
    private keyS: Phaser.Input.Keyboard.Key | undefined;
    private keyD: Phaser.Input.Keyboard.Key | undefined;

    constructor(scene: Scene, config: PlayerConfig) {
        this.scene = scene;
        this.NORMAL_SPEED = config.normalSpeed ?? 100;
        this.SPRINT_SPEED = config.sprintSpeed ?? 200;
        
        this.setupPlayer(config);
        this.setupInput();
    }

    private setupPlayer(config: PlayerConfig): void {
        const sprite = this.scene.physics.add.sprite(config.startX, config.startY, config.spriteKey);
        sprite.setScale(2);
        
        // Ajustar hitbox do jogador
        sprite.body.setSize(8, 8); // Tamanho menor para colisões mais precisas
        sprite.body.setOffset(4, 8); // Offset para centralizar a hitbox

        this.player = {
            sprite,
            direction: 'down',
            isMoving: false,
            stats: {
                clearance: config.clearance ?? 'visitor' // Default to 'visitor' if no clearance provided
            }
        };

        this.createPlayerAnimations();
    }

    private createPlayerAnimations(): void {
        // Criar animações do jogador
        this.scene.anims.create({
            key: 'walk-down',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk-up',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk-left',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'walk-right',
            frames: this.scene.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'idle-down',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 10
        });

        this.scene.anims.create({
            key: 'idle-up',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 10
        });

        this.scene.anims.create({
            key: 'idle-left',
            frames: [{ key: 'player', frame: 8 }],
            frameRate: 10
        });

        this.scene.anims.create({
            key: 'idle-right',
            frames: [{ key: 'player', frame: 12 }],
            frameRate: 10
        });
    }

    private setupInput(): void {
        if (!this.scene.input?.keyboard) {
            console.warn('[PlayerController] Keyboard not available');
            return;
        }
        
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.keyW = this.scene.input.keyboard.addKey('W');
        this.keyA = this.scene.input.keyboard.addKey('A');
        this.keyS = this.scene.input.keyboard.addKey('S');
        this.keyD = this.scene.input.keyboard.addKey('D');
    }

    public update(): void {
        if (!this.player?.sprite || this.dialogActive || !this.cursors) return;

        const speed = this.cursors.shift.isDown ? this.SPRINT_SPEED : this.NORMAL_SPEED;
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.keyA?.isDown) {
            velocityX = -speed;
            this.player.sprite.setFlipX(true);
        } else if (this.cursors.right.isDown || this.keyD?.isDown) {
            velocityX = speed;
            this.player.sprite.setFlipX(false);
        }

        if (this.cursors.up.isDown || this.keyW?.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.keyS?.isDown) {
            velocityY = speed;
        }

        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= Math.SQRT1_2;
            velocityY *= Math.SQRT1_2;
        }

        this.player.sprite.setVelocity(velocityX, velocityY);

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
                this.scene.physics.add.collider(this.player.sprite, layer, undefined, undefined, this);
                console.log(`Colisão configurada para camada: ${layer.layer.name}`);
            }
        });
    }

    public getPlayer(): Player {
        return this.player;
    }

    public setDialogActive(active: boolean): void {
        console.log('[PlayerController] Setting dialog active:', active);
        this.dialogActive = active;
        
        // Sempre parar o movimento quando o diálogo é ativado
        if (active) {
            if (this.player?.sprite) {
                this.player.sprite.setVelocity(0, 0);
                this.player.sprite.anims.play('idle', true);
            }
        }
        
        // Garantir que o input seja configurado corretamente
        if (!active) {
            this.setupKeyboardInput();
        }
    }

    public isDialogActive(): boolean {
        return this.dialogActive;
    }

    private setupKeyboardInput(): void {
        if (!this.scene.input?.keyboard) {
            console.warn('[PlayerController] Keyboard not available');
            return;
        }

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keyW = this.scene.input.keyboard.addKey('W');
        this.keyA = this.scene.input.keyboard.addKey('A');
        this.keyS = this.scene.input.keyboard.addKey('S');
        this.keyD = this.scene.input.keyboard.addKey('D');
    }
} 