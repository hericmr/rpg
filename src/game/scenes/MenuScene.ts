import { Scene, GameObjects, Input, Sound } from 'phaser';

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

    constructor() {
        super({ key: 'MenuScene' });
    }

    preload(): void {
        const publicUrl = process.env.PUBLIC_URL || '';
        this.load.image('background', `${publicUrl}/assets/menu.png`);
        this.load.image('title', `${publicUrl}/assets/titulo.svg`);

        this.load.audio('menuMusic', `${publicUrl}/assets/msc.wav`);
        this.load.image('character', `${publicUrl}/assets/character.png`);
        this.load.image('xumbro', `${publicUrl}/assets/xumbro.png`);
    }

    create(): void {
        // Start music immediately
        this.menuMusic = this.sound.add('menuMusic', { volume: 0.3, loop: true });
        this.menuMusic.play();

        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Create background with proper scaling
        this.background = this.add.image(screenWidth / 2, screenHeight / 2, 'background');
        this.background.setDisplaySize(screenWidth, screenHeight);

        // Create scanline effect
        this.scanline = this.add.rectangle(0, 0, screenWidth, 1, 0x00ff00, 0.3);
        this.scanline.setOrigin(0, 0);
        
        // Add neon glow to scanline
        const scanlineGlow = this.add.rectangle(0, 0, screenWidth, 2, 0x00ff00, 0.2);
        scanlineGlow.setOrigin(0, 0);
        
        // Add scanline animation with enhanced effect
        this.tweens.add({
            targets: [this.scanline, scanlineGlow],
            y: screenHeight,
            duration: 2000,
            repeat: -1,
            ease: 'Linear',
            onUpdate: () => {
                const flicker = Math.random() * 0.1 + 0.25;
                this.scanline.setAlpha(0.3 + flicker);
                scanlineGlow.setAlpha(0.2 + flicker);
            }
        });

        // Create title with initial alpha 0 and glitch effect
        this.title = this.add.image(screenWidth / 2, screenHeight * 0.15, 'title');
        this.title.setScale(0.5);
        this.title.setAlpha(0);
        this.title.setDepth(10);

        // Add glitch animation to title with random scale and rotation
        this.time.addEvent({
            delay: 300,
            callback: () => {
                const randomScale = 0.5 + (Math.random() * 0.2 - 0.1);
                const randomRotation = Math.random() * 0.1 - 0.2; // Random rotation between -0.05 and 0.05 radians
                this.title.setScale(randomScale);
                this.title.setRotation(randomRotation);
            },
            loop: true
        });

        // Create year counter with cyberpunk style
        this.yearCounter = this.add.text(screenWidth / 2.06, screenHeight * 0.30, '0000', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
        this.yearCounter.setOrigin(0.55);
        this.yearCounter.setAlpha(0);
        this.yearCounter.setDepth(9);
        this.time.delayedCall(1000, () => {
            this.yearCounter.setAlpha(1);
        });

        // Create character with initial position off-screen
        this.character = this.add.image(-80, screenHeight * 0.85, 'character');
        this.character.setScale(0.5);

        // Create xumbro with initial position off-screen
        this.xumbro = this.add.image(screenWidth + 80, screenHeight * 0.85, 'xumbro');
        this.xumbro.setScale(0.5);

        // Delay character entry animation
        this.time.delayedCall(1500, () => {
            // Animate character entry
            this.tweens.add({
                targets: this.character,
                x: screenWidth * 0.15,
                duration: 1000,
                ease: 'Power2'
            });
        });

        // Animate xumbro entry after delay
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: this.xumbro,
                x: screenWidth * 0.85,
                duration: 1000,
                ease: 'Power2'
            });
        });

        // Show title with fade in animation
        this.time.delayedCall(1000, () => {
            this.title.setAlpha(1);
            
            // Start year counter animation after title appears
            this.time.delayedCall(500, () => {
                this.yearCounter.setAlpha(1);
                this.animateYearCounter();
            });
        });

        // Create and show button after 3 seconds
        this.time.delayedCall(3000, () => {
            this.createButton();
            this.button.setAlpha(0);
            this.tweens.add({
                targets: this.button,
                alpha: 1,
                duration: 500,
                ease: 'Power2'
            });
        });
        this.startText = this.add.text(screenWidth / 2, screenHeight * 0.95, 'APERTE ESPAÇO', {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#1a3300',
            backgroundColor: '#ffff00',
            padding: { x: 4, y: 2 },
            fixedWidth: 90,
            fixedHeight: 12,
            align: 'center'
        });
        this.startText.setOrigin(0.5);
        this.startText.setAlpha(0);
        
        // Add fade in/out animation to start text
        this.tweens.add({
            targets: this.startText,
            alpha: { from: 0, to: 1 },
            duration: 800,
            repeat: -1,
            yoyo: true
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.cameras.main.flash(500, 255, 255, 0);
            
            const glitchDuration = 500;
            const glitchSteps = 5;
            for (let i = 0; i < glitchSteps; i++) {
                this.time.delayedCall(i * (glitchDuration / glitchSteps), () => {
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
                    this.menuMusic.stop();
                    this.scene.start('VideoScene');
                }
            });
        });
        
        this.scale.on('resize', this.handleResize, this);
    }

    private createButton(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        this.button = this.add.image(screenWidth / 2, screenHeight * 0.85, 'button').setVisible(false);
        this.button.setScale(0.5);
        this.button.setAlpha(1);
        this.button.setInteractive();
        
        const buttonGlow = this.add.graphics();
        buttonGlow.lineStyle(1, 0x00ff00, 0.3);
        buttonGlow.strokeRoundedRect(
            this.button.x - (this.button.displayWidth / 2) - 2,
            this.button.y - (this.button.displayHeight / 2) - 2,
            this.button.displayWidth + 4,
            this.button.displayHeight + 4,
            4
        );
        buttonGlow.setAlpha(0.3);
        
        this.button.on('pointerover', () => {
            this.tweens.add({
                targets: [this.button, buttonGlow],
                scaleX: 0.6,
                scaleY: 0.6,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        this.button.on('pointerout', () => {
            this.tweens.add({
                targets: [this.button, buttonGlow],
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 200,
                ease: 'Power2'
            });
        });

        this.button.on('pointerdown', () => {
            // Flash the screen with a yellow color (RGB: 255,255,0) for 500ms
            this.cameras.main.flash(500, 255, 255, 0);
            
            const glitchDuration = 500;
            const glitchSteps = 5;
            for (let i = 0; i < glitchSteps; i++) {
                this.time.delayedCall(i * (glitchDuration / glitchSteps), () => {
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
                    this.menuMusic.stop();
                    this.scene.start('VideoScene');
                }
            });
        });
    }

    private handleResize(): void {
        const newWidth = this.cameras.main.width;
        const newHeight = this.cameras.main.height;
        
        this.background.setPosition(newWidth / 2, newHeight / 2);
        this.background.setDisplaySize(newWidth, newHeight);
        
        this.title.setPosition(newWidth / 2, newHeight * 0.15);
        
        if (this.yearCounter) {
            this.yearCounter.setPosition(newWidth / 2, newHeight * 0.25);
        }
        
        if (this.character && this.xumbro) {
            this.character.setPosition(newWidth * 0.15, newHeight * 0.85);
            this.xumbro.setPosition(newWidth * 0.85, newHeight * 0.85);
        }
        
        
        if (this.startText) {
            this.startText.setPosition(newWidth / 2, newHeight * 0.95);
        }
        
        this.scanline.width = newWidth;
        const scanlineGlow = this.children.list.find(
            child => child instanceof Phaser.GameObjects.Rectangle && child !== this.scanline
        ) as Phaser.GameObjects.Rectangle;
        if (scanlineGlow) {
            scanlineGlow.width = newWidth;
        }
    }

    private animateYearCounter(): void {
        const targetYear = 2099;
        const duration = 2000;
        const steps = 50;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const updateCounter = () => {
            currentStep++;
            const progress = currentStep / steps;
            this.yearValue = Math.floor(progress * targetYear);
            this.yearCounter.setText(this.yearValue.toString().padStart(4, '0'));

            if (Math.random() > 0.7) {
                this.yearCounter.setTint(0xff00ff);
                this.time.delayedCall(50, () => {
                    this.yearCounter.clearTint();
                });
            }

            if (currentStep < steps) {
                this.time.delayedCall(stepDuration, updateCounter);
            } else {
                this.cameras.main.shake(30, 0.005);
                this.yearCounter.setTint(0x00ff77);
                this.time.delayedCall(100, () => {
                    this.yearCounter.clearTint();
                });
            }
        };

        updateCounter();
    }
} 