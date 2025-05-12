import { Scene, GameObjects, Sound } from 'phaser';

export default class MenuScene extends Scene {
    private background!: GameObjects.Image;
    private title!: GameObjects.Image;
    private button!: GameObjects.Image;
    private menuMusic!: Sound.BaseSound;
    private scanline!: GameObjects.Rectangle;
    private startText!: GameObjects.Text;
    private character!: GameObjects.Image;
    private xumbro!: GameObjects.Image;
    private yearCounter!: GameObjects.Text;
    private yearValue: number = 0;
    private isActive: boolean = false;

    constructor() {
        super({ key: 'MenuScene' });
    }

    preload(): void {
        const publicUrl = process.env.PUBLIC_URL || '';
        this.load.image('background', `${publicUrl}/assets/menu.png`);
        this.load.image('title', `${publicUrl}/assets/titulo.svg`);
        this.load.image('button', `${publicUrl}/assets/mapa.png`);
        this.load.image('character', `${publicUrl}/assets/character.png`);
        this.load.image('xumbro', `${publicUrl}/assets/xumbro.png`);
        this.load.audio('menuMusic', `${publicUrl}/assets/assets_msc.wav`);
    }

    create(): void {
        this.isActive = true;
        this.menuMusic = this.sound.add('menuMusic', { volume: 0.4, loop: true });
        this.menuMusic.play();

        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        this.background = this.add.image(screenWidth / 2, screenHeight / 2, 'background').setDisplaySize(screenWidth, screenHeight);

        this.scanline = this.add.rectangle(0, 0, screenWidth, 1, 0x00ff00, 0.3).setOrigin(0, 0);
        const scanlineGlow = this.add.rectangle(0, 0, screenWidth, 2, 0x00ff00, 0.2).setOrigin(0, 0);
        
        this.tweens.add({
            targets: [this.scanline, scanlineGlow],
            y: screenHeight,
            duration: 1500,
            repeat: -1,
            ease: 'Linear',
            onUpdate: () => {
                const flicker = Math.random() * 0.1 + 0.25;
                this.scanline.setAlpha(0.3 + flicker);
                scanlineGlow.setAlpha(0.2 + flicker);
            }
        });

        this.title = this.add.image(screenWidth / 2, screenHeight * 0.15, 'title').setScale(0.5).setAlpha(0).setDepth(10);

        this.time.addEvent({
            delay: 300,
            callback: () => {
                const randomScale = 0.5 + (Math.random() * 0.2 - 0.1);
                const randomRotation = Math.random() * 0.1 - 0.2;
                this.title.setScale(randomScale).setRotation(randomRotation);
            },
            loop: true
        });

        this.yearCounter = this.add.text(screenWidth / 2.06, screenHeight * 0.30, '0000', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#00ffff'
        }).setOrigin(0.55).setAlpha(0).setDepth(9);

        this.character = this.add.image(-80, screenHeight * 0.85, 'character').setScale(0.5);
        this.xumbro = this.add.image(screenWidth + 80, screenHeight * 0.85, 'xumbro').setScale(0.5);

        this.time.delayedCall(1500, () => {
            this.tweens.add({ targets: this.character, x: screenWidth * 0.15, duration: 1000, ease: 'Expo.easeOut' });
        });

        this.time.delayedCall(2000, () => {
            this.tweens.add({ targets: this.xumbro, x: screenWidth * 0.85, duration: 1000, ease: 'Expo.easeOut' });
        });

        this.time.delayedCall(1000, () => {
            this.title.setAlpha(1);
            this.time.delayedCall(500, () => {
                this.yearCounter.setAlpha(1);
                this.animateYearCounter();
            });
        });

            this.createButton();

        this.startText = this.add.text(screenWidth / 2, screenHeight * 0.95, 'APERTE ESPAÇO', {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#1a3300',
            backgroundColor: '#ffff00',
            padding: { x: 4, y: 2 },
            fixedWidth: 90,
            fixedHeight: 12,
            align: 'center'
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: this.startText,
            alpha: { from: 0, to: 1 },
            duration: 800,
            repeat: -1,
            yoyo: true
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.transitionToNextScene();
        });
        
        this.scale.on('resize', this.handleResize, this);
    }

    private createButton(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        this.button = this.add.image(screenWidth / 2, screenHeight * 0.85, 'button').setScale(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        
        const glow = this.add.graphics();
        const drawGlow = () => {
            glow.clear();
            glow.lineStyle(1, 0x00ff00, 0.3);
            glow.strokeRoundedRect(
                this.button.x - (this.button.displayWidth / 2) - 2,
                this.button.y - (this.button.displayHeight / 2) - 2,
                this.button.displayWidth + 4,
                this.button.displayHeight + 4,
                4
            );
        };
        drawGlow();
        glow.setAlpha(0.4);
        
        this.tweens.add({ targets: this.button, alpha: 1, duration: 600, ease: 'Sine.easeIn' });

        this.button.on('pointerover', () => {
            this.tweens.add({
                targets: [this.button, glow],
                scaleX: 0.6,
                scaleY: 0.6,
                duration: 150,
                ease: 'Power1',
                onUpdate: drawGlow
            });
        });
        
        this.button.on('pointerout', () => {
            this.tweens.add({
                targets: [this.button, glow],
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 150,
                ease: 'Power1',
                onUpdate: drawGlow
            });
        });

        this.button.on('pointerdown', () => {
            if (!this.isActive) return;
            this.transitionToNextScene();
        });
    }
            
    private transitionToNextScene(): void {
            this.cameras.main.flash(500, 255, 255, 0);
            
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 100, () => {
                    this.button.setPosition(
                        screenWidth / 2 + (Math.random() - 0.5) * 2,
                        screenHeight * 0.85 + (Math.random() - 0.5) * 2
                    );
                });
            }
            
            this.tweens.add({
                targets: [this.background, this.title, this.button, this.startText, this.character, this.xumbro],
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.menuMusic?.stop();
                    this.scene.start('VideoScene');
                }
            });
    }

    private animateYearCounter(): void {
        const targetYear = 2099;
        const duration = 2000;
        const steps = 50;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const update = () => {
            currentStep++;
            const progress = currentStep / steps;
            this.yearValue = Math.floor(progress * targetYear);
            this.yearCounter.setText(this.yearValue.toString().padStart(4, '0'));

            if (Math.random() > 0.7) {
                this.yearCounter.setTint(0xff00ff);
                this.time.delayedCall(50, () => this.yearCounter.clearTint());
            }

            if (currentStep < steps) {
                this.time.delayedCall(stepDuration, update);
            } else {
                this.cameras.main.shake(30, 0.005);
                this.yearCounter.setTint(0x00ff77);
                this.time.delayedCall(100, () => this.yearCounter.clearTint());
            }
        };

        update();
            }

    private handleResize(): void {
        if (!this.isActive || !this.cameras?.main) return;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.background.setPosition(width / 2, height / 2).setDisplaySize(width, height);
        this.title?.setPosition(width / 2, height * 0.15);
        this.yearCounter?.setPosition(width / 2, height * 0.30);
        this.character?.setPosition(width * 0.15, height * 0.85);
        this.xumbro?.setPosition(width * 0.85, height * 0.85);
        this.startText?.setPosition(width / 2, height * 0.95);
        this.scanline?.setSize(width, 1);
    }

    shutdown(): void {
        this.isActive = false;
        this.scale.off('resize', this.handleResize, this);
        this.menuMusic.stop();
    }
} 