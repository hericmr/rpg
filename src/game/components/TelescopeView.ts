import { Scene, GameObjects } from 'phaser';

interface TelescopeConfig {
    scene: Scene;
    imageKey: string;
    x?: number;
    y?: number;
    radius?: number;
    panSpeed?: number;
    maxOffset?: number;
    borderColor?: number;
    crosshairColor?: number;
    onClose?: () => void;
}

export class TelescopeView {
    private scene: Scene;
    private container: GameObjects.Container;
    private cityImage!: GameObjects.Image;
    private mask!: GameObjects.Graphics;
    private scopeBorder!: GameObjects.Graphics;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private updateEvent!: Phaser.Events.EventEmitter;
    private isActive: boolean = true;

    private config: Required<TelescopeConfig>;
    private defaultConfig = {
        x: 0,
        y: 0,
        radius: 150,
        panSpeed: 5,
        maxOffset: 200,
        borderColor: 0xFFFFFF,
        crosshairColor: 0xFFFFFF,
        onClose: () => {}
    };

    constructor(config: TelescopeConfig) {
        this.scene = config.scene;
        this.config = { ...this.defaultConfig, ...config };

        // Inicializar componentes
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(1000);

        this.setupView();
        this.setupControls();
        this.startUpdate();
    }

    private setupView(): void {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        // Criar fundo preto
        const blackOverlay = this.scene.add.rectangle(
            0, 0, screenWidth, screenHeight, 0x000000
        );
        blackOverlay.setOrigin(0, 0);

        // Criar imagem central com tamanho aumentado
        this.cityImage = this.scene.add.image(
            screenWidth / 1.5,
            screenHeight / 1.5,
            this.config.imageKey
        );
        
        // Calcular a escala necessária para cobrir a área do telescópio
        const imageWidth = this.cityImage.width;
        const imageHeight = this.cityImage.height;
        const scale = Math.max(
            (screenWidth + this.config.maxOffset * 2) / imageWidth,
            (screenHeight + this.config.maxOffset * 2) / imageHeight
        );
        this.cityImage.setScale(scale);

        // Criar máscara circular
        this.mask = this.scene.add.graphics();
        this.updateMask();

        // Criar borda do escopo
        this.scopeBorder = this.scene.add.graphics();
        this.updateScopeBorder();

        // Adicionar elementos ao container
        this.container.add([blackOverlay, this.cityImage, this.scopeBorder]);
        
        // Aplicar máscara à imagem
        this.cityImage.setMask(this.mask.createGeometryMask());
    }

    private updateMask(): void {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        this.mask.clear();
        this.mask.fillStyle(0xffffff);
        this.mask.beginPath();
        this.mask.arc(
            screenWidth / 2,
            screenHeight / 2,
            this.config.radius,
            0,
            Math.PI * 2,
            true
        );
        this.mask.closePath();
        this.mask.fill();
    }

    private updateScopeBorder(): void {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        this.scopeBorder.clear();

        // Desenhar círculo
        this.scopeBorder.lineStyle(2, 0x000000);
        this.scopeBorder.beginPath();
        this.scopeBorder.arc(
            screenWidth / 2,
            screenHeight / 2,
            this.config.radius,
            0,
            Math.PI * 2
        );
        this.scopeBorder.closePath();
        this.scopeBorder.stroke();
    }

    private setupControls(): void {
        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            this.cursors = keyboard.createCursorKeys();
            
            // Adicionar tecla ESC para sair
            keyboard.on('keydown-ESC', () => {
                if (this.isActive) {
                    this.destroy();
                }
            });
        } else {
            console.warn('[TelescopeView] Keyboard not available for telescope controls');
        }
    }

    private startUpdate(): void {
        this.updateEvent = this.scene.events.on('update', this.update, this);
    }

    private update(): void {
        if (!this.isActive || !this.cursors) return;

        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        // Atualizar posição baseado nas teclas
        if (this.cursors.left.isDown) {
            this.cityImage.x += this.config.panSpeed;
        }
        if (this.cursors.right.isDown) {
            this.cityImage.x -= this.config.panSpeed;
        }
        if (this.cursors.up.isDown) {
            this.cityImage.y += this.config.panSpeed;
        }
        if (this.cursors.down.isDown) {
            this.cityImage.y -= this.config.panSpeed;
        }

        // Calcular limites baseados no tamanho da imagem escalada
        const imageHalfWidth = (this.cityImage.width * this.cityImage.scaleX) / 2;
        const imageHalfHeight = (this.cityImage.height * this.cityImage.scaleY) / 2;
        
        // Limitar movimento para manter a imagem sempre visível na área do telescópio
        const minX = screenWidth / 2 - (imageHalfWidth - this.config.radius);
        const maxX = screenWidth / 2 + (imageHalfWidth - this.config.radius);
        const minY = screenHeight / 2 - (imageHalfHeight - this.config.radius);
        const maxY = screenHeight / 2 + (imageHalfHeight - this.config.radius);

        this.cityImage.x = Phaser.Math.Clamp(this.cityImage.x, minX, maxX);
        this.cityImage.y = Phaser.Math.Clamp(this.cityImage.y, minY, maxY);
    }

    public destroy(): void {
        this.isActive = false;
        
        // Remove keyboard event listeners
        if (this.cursors) {
            const keyboard = this.scene.input.keyboard;
            if (keyboard) {
                keyboard.off('keydown-ESC');
            }
        }
        
        // Remove update event
        if (this.updateEvent) {
            this.scene.events.off('update', this.update, this);
        }
        
        // Destroy all graphics and containers
        if (this.mask) {
            this.mask.destroy();
        }
        if (this.scopeBorder) {
            this.scopeBorder.destroy();
        }
        if (this.cityImage) {
            this.cityImage.destroy();
        }
        if (this.container) {
            this.container.destroy(true);
        }
        
        this.config.onClose();
    }

    // Métodos públicos para extensibilidade
    public setRadius(radius: number): void {
        this.config.radius = radius;
        this.updateMask();
        this.updateScopeBorder();
    }

    public setPanSpeed(speed: number): void {
        this.config.panSpeed = speed;
    }

    public setMaxOffset(offset: number): void {
        this.config.maxOffset = offset;
    }

    public setBorderColor(color: number): void {
        this.config.borderColor = color;
        this.updateScopeBorder();
    }

    public setCrosshairColor(color: number): void {
        this.config.crosshairColor = color;
        this.updateScopeBorder();
    }

    public getPosition(): { x: number; y: number } {
        return {
            x: this.cityImage.x,
            y: this.cityImage.y
        };
    }

    public setPosition(x: number, y: number): void {
        this.cityImage.x = x;
        this.cityImage.y = y;
    }

    public isViewActive(): boolean {
        return this.isActive;
    }
} 