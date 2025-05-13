import { Scene, GameObjects, Input } from 'phaser';

export default class VideoScene extends Scene {
    private video!: GameObjects.Video;
    private skipText!: GameObjects.Text;
    private background!: GameObjects.Rectangle;
    private isActive: boolean = false;
    private resizeTimeout: number | null = null;
    private videoLoaded: boolean = false;
    private keySpace!: Input.Keyboard.Key;
    private lastDimensions: { width: number; height: number } | null = null;
    private pendingResize: boolean = false;

    constructor() {
        super({ key: 'VideoScene' });
    }

    preload(): void {
        this.load.video('introVideo', `${process.env.PUBLIC_URL || ''}/assets/1003.mp4`);
    }

    create(): void {
        this.isActive = true;
        console.log('[VideoScene] Created');
        
        // Stop all sounds from previous scenes
        this.sound.stopAll();
        
        // Configurar input primeiro
        this.keySpace = this.input.keyboard!.addKey('SPACE');
        this.input.keyboard!.enabled = true;
        
        this.setupGameContainer(true);
        this.createInitialElements();
        this.setupEventListeners();

        // Aguardar o vídeo carregar completamente
        this.video.on('loadeddata', () => {
            console.log('[VideoScene] Video loaded:', {
                width: this.video.width,
                height: this.video.height,
                duration: this.video.getDuration()
            });
            this.videoLoaded = true;
            
            // Configurar elementos após o vídeo carregar
            this.createVideoElements();
            
            // Se houver um resize pendente, aplicar agora
            if (this.pendingResize) {
                console.log('[VideoScene] Applying pending resize');
                this.handleResize();
                this.pendingResize = false;
            }
        });
    }

    private setupGameContainer(add: boolean): void {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList[add ? 'add' : 'remove']('video-scene');
        }
    }

    private createInitialElements(): void {
        if (!this.cameras.main) return;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.background = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0, 0)
            .setDepth(0);

        // Skip text
        this.skipText = this.add.text(width / 2, height - 40, 'ESPAÇO para pular', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#FFD700',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(100);

        // Criar vídeo
        this.video = this.add.video(width / 2, height / 2, 'introVideo')
            .setDepth(1)
            .setPipeline('TextureTintPipeline')
            .setOrigin(0.5, 0.5);

        // Iniciar o vídeo
        this.video.play(true);

        console.log('[VideoScene] Video created and playing');
    }

    private createVideoElements(): void {
        if (!this.cameras.main || !this.video || !this.videoLoaded) {
            console.log('[VideoScene] Cannot create video elements yet');
            return;
        }
        
        console.log('[VideoScene] Setting up video elements');
        
        // Agora que o vídeo está carregado, podemos configurá-lo corretamente
        this.scaleVideoProportionally();
    }

    private scaleVideoProportionally(): void {
        if (!this.cameras.main || !this.video || !this.videoLoaded) {
            console.log('[VideoScene] Scale aborted - waiting for video');
            this.pendingResize = true;
            return;
        }

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const videoWidth = this.video.width;
        const videoHeight = this.video.height;

        console.log('[VideoScene] Scaling video:', {
            screen: { width, height },
            video: { width: videoWidth, height: videoHeight }
        });

        // Verificar se as dimensões realmente mudaram
        const newDimensions = { width, height };
        if (this.lastDimensions && 
            this.lastDimensions.width === width && 
            this.lastDimensions.height === height) {
            return;
        }
        this.lastDimensions = newDimensions;

        const videoAspectRatio = videoWidth / videoHeight;
        let displayWidth = width;
        let displayHeight = width / videoAspectRatio;

        if (displayHeight > height) {
            displayHeight = height;
            displayWidth = height * videoAspectRatio;
        }

        console.log('[VideoScene] Setting display size:', { displayWidth, displayHeight });

        this.video
            .setDisplaySize(displayWidth, displayHeight)
            .setPosition(width / 2, height / 2)
            .setOrigin(0.5, 0.5);
    }

    private setupEventListeners(): void {
        this.events.on('update', this.checkInput, this);
        this.video.once('complete', this.endScene, this);
        
        // Debounce do evento de resize
        this.scale.on('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = window.setTimeout(() => {
                if (this.videoLoaded) {
                    this.handleResize();
                } else {
                    this.pendingResize = true;
                }
            }, 100) as unknown as number;
        }, this);
    }

    private checkInput(): void {
        if (this.isActive && this.keySpace.isDown) {
            this.endScene();
        }
    }

    private handleResize(): void {
        if (!this.isActive || !this.cameras.main) return;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        if (this.background) {
            this.background.setSize(width, height);
        }

        this.scaleVideoProportionally();

        if (this.skipText) {
            this.skipText.setPosition(width / 2, height - 40);
        }
    }

    private endScene(): void {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.setupGameContainer(false);
        if (this.video?.scene) {
            this.video.stop();
        }
        this.scene.start('GameScene');
    }

    shutdown(): void {
        this.isActive = false;
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.scale.off('resize', this.handleResize, this);
        this.events.off('update', this.checkInput, this);
        this.setupGameContainer(false);
        
        if (this.video?.scene) {
            this.video.destroy();
        }
        if (this.background?.scene) {
            this.background.destroy();
        }
        
        this.input.keyboard!.enabled = false;
    }
}