import { Scene, GameObjects } from 'phaser';

export default class BootScene extends Scene {
    private morphingSprite!: GameObjects.Sprite;
    private copyrightText!: GameObjects.Text;

    private readonly FPS = 24;
    private readonly FRAME_HOLD = 3 * this.FPS;
    private readonly publicUrl = process.env.PUBLIC_URL || '';

    constructor() {
        super({ key: 'BootScene' });
    }

    preload(): void {
        this.load.image('menu', `${this.publicUrl}/assets/menu.png`);
        this.load.audio('msc', `${this.publicUrl}/assets/eletronic.ogg`);

        this.loadFrameSequence(0, 49);
    }

    create(): void {
        this.cameras.main.setBackgroundColor('#000');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        this.sound.play('msc', { volume: 0.2, loop: true });

        this.createMorphingSprite();
        this.createAnimations();
        this.createCopyrightText();

        this.playIntroSequence();
    }

    private loadFrameSequence(start: number, end: number): void {
        for (let i = start; i <= end; i++) {
            const frame = i.toString().padStart(3, '0');
            this.load.image(`frame_${frame}`, `${this.publicUrl}/assets/frames/frame_${frame}.png`);
        }
    }

    private createMorphingSprite(): void {
        this.morphingSprite = this.add.sprite(
            this.scale.width / 2,
            this.scale.height / 2,
            'frame_000'
        );
        this.morphingSprite.setAlpha(0);
        this.morphingSprite.setScale(0.3);
    }

    private createAnimations(): void {
        this.anims.create({
            key: 'morph',
            frames: [
                ...Array(this.FRAME_HOLD).fill({ key: 'frame_000' }),
                ...this.generateFrames(1, 48),
                ...Array(this.FRAME_HOLD).fill({ key: 'frame_049' })
            ],
            frameRate: this.FPS,
            repeat: 0
        });

        this.anims.create({
            key: 'morphLoop',
            frames: [
                ...this.generateFrames(1, 48),
                ...Array(this.FRAME_HOLD).fill({ key: 'frame_049' })
            ],
            frameRate: this.FPS,
            repeat: -1
        });
    }

    private playIntroSequence(): void {
        this.tweens.add({
            targets: this.morphingSprite,
            alpha: 1,
            duration: 2000,
            onComplete: () => {
                this.morphingSprite.play('morph');
                this.animateMorphingSprite();

                this.morphingSprite.once('animationcomplete', () => {
                    this.morphingSprite.play('morphLoop');
                });

                this.revealCopyright();
            }
        });
    }

    private animateMorphingSprite(): void {
        this.tweens.add({
            targets: this.morphingSprite,
            scale: 0.35,
            duration: 7000,
            ease: 'Sine.easeInOut'
        });
    }

    private createCopyrightText(): void {
        this.copyrightText = this.add.text(
            this.scale.width / 2,
            this.scale.height - 55,
            'Papai Lion\nIndie Games\n\nTODOS OS DIREITOS RESERVADOS',
            {
                fontFamily: 'monospace',
                fontSize: '8px',
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5).setAlpha(0);
    }

    private revealCopyright(): void {
        this.tweens.add({
            targets: this.copyrightText,
            alpha: 1,
            duration: 1000,
            delay: 1000
        });

        this.tweens.add({
            targets: this.copyrightText,
            alpha: { from: 0.4, to: 1 },
            yoyo: true,
            repeat: -1,
            duration: 1000,
            delay: 2500
        });

        this.tweens.add({
            targets: [this.morphingSprite, this.copyrightText],
            alpha: 0,
            duration: 2000,
            delay: 5000
        });

        this.time.delayedCall(9000, () => this.scene.start('MenuScene'));
    }

    private generateFrames(start: number, end: number): { key: string }[] {
        return Array.from({ length: end - start + 1 }, (_, i) => {
            const frame = (i + start).toString().padStart(3, '0');
            return { key: `frame_${frame}` };
        });
    }
} 