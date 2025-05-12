import { Scene, GameObjects } from 'phaser';

export default class BootScene extends Scene {
    private morphingSprite!: GameObjects.Sprite;
    private copyrightText!: GameObjects.Text;

    private readonly FPS = 24;
    private readonly FRAME_HOLD = 3 * this.FPS;
    private readonly publicUrl = process.env.PUBLIC_URL || '';

    // Constantes de tempo para clareza
    private readonly INTRO_TWEEN_DURATION = 2000;
    private readonly COPYRIGHT_FADE_DELAY = 5000;
    private readonly LOOP_START_DELAY = 9000;
    private readonly SCALE_ANIM_DURATION = 7000;

    constructor() {
        super({ key: 'BootScene' });
    }

    preload(): void {
        this.load.image('menu', this.assetPath('menu.png'));
        this.load.audio('msc', this.assetPath('musicaambiente.mp3'));
        this.loadFrameSequence(0, 49);
    }

    create(): void {
        this.setupCamera();
        this.startMusic();
        this.createMorphingSprite();
        this.createAnimations();
        this.createCopyrightText();
        this.playIntroSequence();

        // Permitir pular cena com a tecla espaço
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-SPACE', () => {
                this.skipIntro();
            });
        }
    }

    // === Helpers ===

    private assetPath(file: string): string {
        return `${this.publicUrl}/assets/${file}`;
    }

    private setupCamera(): void {
        this.cameras.main.setBackgroundColor('#000');
        this.cameras.main.fadeIn(1000, 0, 0, 0);
    }

    private startMusic(): void {
        this.sound.play('msc', { volume: 0.2, loop: true });
    }

    private loadFrameSequence(start: number, end: number): void {
        for (let i = start; i <= end; i++) {
            const frame = i.toString().padStart(3, '0');
            this.load.image(`frame_${frame}`, this.assetPath(`frames/frame_${frame}.png`));
        }
    }

    private generateFrames(start: number, end: number): { key: string }[] {
        return Array.from({ length: end - start + 1 }, (_, i) => {
            const frame = (i + start).toString().padStart(3, '0');
            return { key: `frame_${frame}` };
        });
    }

    private createAnimation(key: string, frames: { key: string }[], repeat: number): void {
        this.anims.create({
            key,
            frames,
            frameRate: this.FPS,
            repeat
        });
    }

    // === Criação de elementos ===

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
        this.createAnimation('morph', [
            ...Array(this.FRAME_HOLD).fill({ key: 'frame_000' }),
            ...this.generateFrames(1, 48),
            ...Array(this.FRAME_HOLD).fill({ key: 'frame_049' })
        ], 0);

        this.createAnimation('morphLoop', [
            ...this.generateFrames(1, 48),
            ...Array(this.FRAME_HOLD).fill({ key: 'frame_049' })
        ], -1);
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

    // === Sequência de introdução ===

    private playIntroSequence(): void {
        this.tweens.add({
            targets: this.morphingSprite,
            alpha: 1,
            duration: this.INTRO_TWEEN_DURATION,
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
            duration: this.SCALE_ANIM_DURATION,
            ease: 'Sine.easeInOut'
        });
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
            delay: this.COPYRIGHT_FADE_DELAY
        });

        this.time.delayedCall(this.LOOP_START_DELAY, () => this.scene.start('MenuScene'));
    }

    // === Pular introdução ===

    private skipIntro(): void {
        this.sound.stopAll();
        this.tweens.killAll();
        this.scene.start('MenuScene');
    }
}
