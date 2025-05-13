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
        this.load.video('introVideo', `${process.env.PUBLIC_URL || ''}/assets/1003.mp4`, true);
    }

    create(): void {
        this.isActive = true;
        console.log('[VideoScene] Created');
        
        // Stop all sounds from previous scenes
        this.sound.stopAll();
        
        // Configurar input primeiro
        this.keySpace = this.input.keyboard!.addKey('SPACE');
        this.input.keyboard!.enabled = true;
        
        // Configurar o container do jogo para modo de vídeo
        this.setupGameContainer(true);
        
        // Criar elementos iniciais
        this.createInitialElements();
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    private setupGameContainer(add: boolean): void {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            if (add) {
                gameContainer.classList.add('video-scene');
                gameContainer.style.width = '100vw';
                gameContainer.style.height = '100vh';
                gameContainer.style.margin = '0';
                gameContainer.style.padding = '0';
                gameContainer.style.display = 'flex';
                gameContainer.style.justifyContent = 'center';
                gameContainer.style.alignItems = 'center';
                gameContainer.style.backgroundColor = '#000000';
            } else {
                gameContainer.classList.remove('video-scene');
                gameContainer.style.removeProperty('width');
                gameContainer.style.removeProperty('height');
                gameContainer.style.removeProperty('margin');
                gameContainer.style.removeProperty('padding');
                gameContainer.style.removeProperty('display');
                gameContainer.style.removeProperty('justify-content');
                gameContainer.style.removeProperty('align-items');
                gameContainer.style.removeProperty('background-color');
            }
        }
    }

    private createInitialElements(): void {
        if (!this.cameras.main) return;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background preto
        this.background = this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0, 0)
            .setDepth(0)
            .setScrollFactor(0);

        // Texto para pular
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

        // Criar e configurar vídeo
        this.video = this.add.video(width / 2, height / 2, 'introVideo')
            .setDepth(1)
            .setScrollFactor(0)
            .setOrigin(0.5, 0.5);

        // Iniciar o vídeo
        this.video.play(true);
        
        // Configurar o vídeo assim que estiver carregado
        this.video.once('loadeddata', () => {
            console.log('[VideoScene] Video loaded:', {
                width: this.video.width,
                height: this.video.height,
                duration: this.video.getDuration()
            });
            this.videoLoaded = true;
            this.scaleVideoProportionally();
        });
    }

    private scaleVideoProportionally(): void {
        if (!this.cameras.main || !this.video || !this.videoLoaded) {
            console.log('[VideoScene] Scale aborted - waiting for video');
            this.pendingResize = true;
            return;
        }

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const videoWidth = this.video.width;
        const videoHeight = this.video.height;

        console.log('[VideoScene] Scaling video:', {
            screen: { width: screenWidth, height: screenHeight },
            video: { width: videoWidth, height: videoHeight }
        });

        // Calcular proporções
        const screenRatio = screenWidth / screenHeight;
        const videoRatio = videoWidth / videoHeight;
        let finalWidth, finalHeight;

        if (screenRatio > videoRatio) {
            // Tela mais larga que o vídeo
            finalHeight = screenHeight;
            finalWidth = screenHeight * videoRatio;
        } else {
            // Tela mais alta que o vídeo
            finalWidth = screenWidth;
            finalHeight = screenWidth / videoRatio;
        }

        console.log('[VideoScene] Final dimensions:', { width: finalWidth, height: finalHeight });

        // Aplicar dimensões
        this.video
            .setDisplaySize(finalWidth, finalHeight)
            .setPosition(screenWidth / 2, screenHeight / 2)
            .setOrigin(0.5, 0.5);

        // Atualizar background
        this.background
            .setSize(screenWidth, screenHeight)
            .setPosition(0, 0);

        // Atualizar texto
        this.skipText.setPosition(screenWidth / 2, screenHeight - 40);
    }

    private setupEventListeners(): void {
        // Input para pular
        this.events.on('update', this.checkInput, this);
        
        // Fim do vídeo
        this.video.once('complete', this.endScene, this);
        
        // Resize da janela
        this.scale.on('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = window.setTimeout(() => {
                if (this.videoLoaded) {
                    this.scaleVideoProportionally();
                } else {
                    this.pendingResize = true;
                }
            }, 100) as unknown as number;
        });
    }

    private checkInput(): void {
        if (this.isActive && this.keySpace.isDown) {
            this.endScene();
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
        
        this.scale.off('resize');
        this.events.off('update', this.checkInput, this);
        this.setupGameContainer(false);
        
        if (this.video?.scene) {
            this.video.destroy();
        }
        if (this.background?.scene) {
            this.background.destroy();
        }
        if (this.skipText?.scene) {
            this.skipText.destroy();
        }
        
        this.input.keyboard!.enabled = false;
    }
}