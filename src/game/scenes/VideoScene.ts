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
        this.skipText = this.add.text(screenWidth - 10, screenHeight - 10, 'pular intro -> ESPAÇO', {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#1a3300',
            backgroundColor: '#ffff00',
            padding: { x: 4, y: 2 },
            fixedWidth: 90,
            fixedHeight: 12,
            align: 'center'
        });
        this.skipText.setOrigin(1, 1);
        this.skipText.setAlpha(0);

        // Add fade in/out animation to skip text
        this.tweens.add({
            targets: this.skipText,
            alpha: { from: 0, to: 1 },
            duration: 800,
            repeat: -1,
            yoyo: true
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

        // Handle space key to skip
        this.input.keyboard?.on('keydown-SPACE', () => {
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