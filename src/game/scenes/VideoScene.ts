import { Scene } from 'phaser';

export default class VideoScene extends Scene {
    private video!: Phaser.GameObjects.Video;
    private skipText!: Phaser.GameObjects.Text;
    private background!: Phaser.GameObjects.Rectangle;
    private keySpace!: Phaser.Input.Keyboard.Key;
    private resizeTimeout: number | null = null;
    private originalSize = { width: 0, height: 0 };
    private lastSize = { width: 0, height: 0 };
    private isActive = false;
    private videoLoaded = false;
    private pendingResize = false;

    constructor() {
        super('VideoScene');
    }

    preload(): void {
        this.load.video('introVideo', `${process.env.PUBLIC_URL || ''}/assets/1003.mp4`, false);
    }

    create(): void {
        this.isActive = true;
        this.originalSize = { width: this.scale.width, height: this.scale.height };
        this.lastSize = { ...this.originalSize };
        this.scale.resize(720, 800);
        this.sound.stopAll();
        
        this.keySpace = this.input.keyboard!.addKey('SPACE');

        this.createBackground();
        this.createSkipText();
        this.createVideo();

        this.setupEvents();
    }

    private createBackground() {
        const { width, height } = this.scale.gameSize;
        this.background = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setDepth(0);
    }

    private createSkipText() {
        const { width, height } = this.scale.gameSize;
        this.skipText = this.add.text(width / 2, height - 40, 'ESPAÇO para pular', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#FFD700',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 },
        }).setOrigin(0.5).setDepth(100);
    }

    private createVideo() {
        const { width, height } = this.scale.gameSize;
        this.video = this.add.video(width / 2, height / 2, 'introVideo')
            .setOrigin(0.5)
            .setDepth(1)
            .play(false);

        this.video.once('loadeddata', () => {
            this.videoLoaded = true;
            this.scaleVideo();
        });

        this.video.once('complete', this.endScene, this);
    }

    private scaleVideo() {
        if (!this.videoLoaded) {
            this.pendingResize = true;
            return;
        }

        const { width: gameW, height: gameH } = this.scale.gameSize;
        const { width: vidW, height: vidH } = this.video;
        const targetHeight = gameH * 0.7;
        const targetWidth = (targetHeight / vidH) * vidW;

        this.video.setDisplaySize(targetWidth, targetHeight).setPosition(gameW / 2, gameH / 2);
        this.background.setSize(gameW, gameH);
        this.skipText.setPosition(gameW / 2, gameH - 40);
    }

    private setupEvents() {
        this.events.on('update', this.checkInput, this);
        
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = window.setTimeout(() => {
                const { width, height } = gameSize;
                if (
                    width !== this.lastSize.width ||
                    height !== this.lastSize.height
                ) {
                    this.lastSize = { width, height };
                    this.videoLoaded ? this.scaleVideo() : (this.pendingResize = true);
                }
            }, 100);
        });
    }

    private checkInput() {
        if (this.isActive && this.keySpace.isDown) this.endScene();
    }

    private endScene() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.video?.stop();
        this.scale.resize(this.originalSize.width, this.originalSize.height);
        this.scene.start('GameScene');
    }

    shutdown(): void {
        this.isActive = false;
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        
        this.scale.resize(this.originalSize.width, this.originalSize.height);
        this.scale.off('resize');
        this.events.off('update', this.checkInput, this);
        
        this.video?.destroy();
        this.background?.destroy();
        this.skipText?.destroy();
        
        this.input.keyboard!.enabled = false;
    }
}
