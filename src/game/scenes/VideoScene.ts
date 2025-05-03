import { Scene, GameObjects } from 'phaser';

export default class VideoScene extends Scene {
    private video!: GameObjects.Video;
    private skipText!: GameObjects.Text;

    constructor() {
        super({ key: 'VideoScene' });
    }

    preload(): void {
        const publicUrl = process.env.PUBLIC_URL || '';
        this.load.video('introVideo', `${publicUrl}/assets/1003.mp4`);
    }

    create(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Create video with proper scaling
        this.video = this.add.video(screenWidth / 2, screenHeight / 2, 'introVideo');
        
        // Calculate video dimensions to maintain aspect ratio
        const videoWidth = screenWidth * 0.40;
        const videoHeight = screenHeight * 0.6;
        this.video.setDisplaySize(videoWidth, videoHeight);

        // Add skip text with cyberpunk style
        this.skipText = this.add.text(screenWidth - 10, screenHeight - 10, 'pular intro', {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#00ff00',
            stroke: '#003300',
            strokeThickness: 1,
            padding: { x: 4, y: 2 },
            backgroundColor: '#00000066'
        });
        this.skipText.setOrigin(1, 1);
        this.skipText.setAlpha(0.8);
        this.skipText.setInteractive();

        // Add glow effect to skip text
        this.tweens.add({
            targets: this.skipText,
            alpha: { from: 0.8, to: 0.4 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Start video with fade in
        this.cameras.main.fadeIn(500);
        this.video.play();

        // Handle skip
        this.skipText.on('pointerdown', () => {
            this.cameras.main.flash(500, 0, 255, 0);
            this.video.stop();
            this.scene.start('GameScene');
        });

        // Handle video completion
        this.video.on('complete', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene');
            });
        });

        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
    }

    private handleResize(): void {
        const newWidth = this.cameras.main.width;
        const newHeight = this.cameras.main.height;
        
        this.video.setPosition(newWidth / 2, newHeight / 2);
        this.video.setDisplaySize(newWidth, newHeight);
        
        this.skipText.setPosition(newWidth - 50, newHeight - 50);
    }
} 