import { Scene, GameObjects, Sound, Types } from 'phaser';

/**
 * Cena de menu principal do jogo
 * @class MenuScene
 * @extends Phaser.Scene
 */
export default class MenuScene extends Scene {
    // Elementos visuais
    private background!: GameObjects.Image;
    private title!: GameObjects.Image;
    private scanline!: GameObjects.Rectangle;
    private scanlineGlow!: GameObjects.Rectangle;
    private startText!: GameObjects.Text;
    private character!: GameObjects.Image;
    private xumbro!: GameObjects.Image;
    private yearCounter!: GameObjects.Text;
    
    // Elementos de áudio
    private menuMusic!: Sound.BaseSound;
    
    // Variáveis de estado
    private yearValue: number = 0;
    private isActive: boolean = false;
    private isTransitioning: boolean = false;
    
    // Configurações
    private readonly TARGET_YEAR: number = 2099;
    private readonly TITLE_SCALE: number = 1;
    private readonly CHARACTER_SCALE: number = 0.55;
    private readonly MUSIC_VOLUME: number = 0.4;

    constructor() {
        super({ key: 'MenuScene' });
    }

    /**
     * Pré-carrega todos os recursos necessários para a cena
     */
    preload(): void {
        try {
        const publicUrl = process.env.PUBLIC_URL || '';
            
            // Carregar imagens
        this.load.image('background', `${publicUrl}/assets/menu.png`);
        this.load.image('title', `${publicUrl}/assets/titulo.svg`);
        this.load.image('character', `${publicUrl}/assets/character.png`);
        this.load.image('xumbro', `${publicUrl}/assets/xumbro.png`);
            
            // Carregar áudio
        this.load.audio('menuMusic', `${publicUrl}/assets/assets_msc.wav`);
        } catch (error) {
            console.error('Erro ao carregar recursos:', error);
        }
    }

    /**
     * Cria todos os elementos da cena de menu
     */
    create(): void {
        this.isActive = true;
        this.isTransitioning = false;
        
        this.createBackground();
        this.createScanlineEffect();
        this.createTitle();
        this.createYearCounter();
        this.createCharacters();
        this.createStartText();
        this.setupMusic();
        this.setupControls();
        
        // Configurar redimensionamento de tela
        this.scale.on('resize', this.handleResize, this);
    }

    /**
     * Cria o fundo da cena
     */
    private createBackground(): void {
        const { width, height } = this.cameras.main;
        this.background = this.add.image(width / 2, height / 2, 'background')
            .setDisplaySize(width, height);
    }

    /**
     * Cria o efeito de scanline
     */
    private createScanlineEffect(): void {
        const { width, height } = this.cameras.main;

        this.scanline = this.add.rectangle(0, 0, width, 1, 0x00ff00, 0.3)
            .setOrigin(0, 0);
            
        this.scanlineGlow = this.add.rectangle(0, 0, width, 2, 0x00ff00, 0.2)
            .setOrigin(0, 0);
        
        this.tweens.add({
            targets: [this.scanline, this.scanlineGlow],
            y: height,
            duration: 1500,
            repeat: -1,
            ease: 'Linear',
            onUpdate: () => {
                const flicker = Math.random() * 0.1 + 0.25;
                this.scanline.setAlpha(0.3 + flicker);
                this.scanlineGlow.setAlpha(0.2 + flicker);
            }
        });
    }

    /**
     * Cria o título do jogo
     */
    private createTitle(): void {
        const { width, height } = this.cameras.main;

        this.title = this.add.image(width / 2, height * 0.15, 'title')
            .setScale(this.TITLE_SCALE)
            .setAlpha(0)
            .setDepth(10);

        this.time.addEvent({
            delay: 300,
            callback: () => {
                if (!this.isActive) return;
                
                const randomScale = this.TITLE_SCALE + (Math.random() * 0.2 - 0.1);
                const randomRotation = Math.random() * 0.1 - 0.2;
                this.title.setScale(randomScale).setRotation(randomRotation);
            },
            loop: true
        });

        this.time.delayedCall(1000, () => {
            if (!this.isActive) return;
            this.title.setAlpha(1);
        });
    }

    /**
     * Cria o contador de anos
     */
    private createYearCounter(): void {
        const { width, height } = this.cameras.main;
        
        this.yearCounter = this.add.text(width / 2.05, height * 0.31, '0000', {
            fontSize: '25px',
            fontFamily: 'monospace',
            color: '#ffa500',
            stroke: '#804000',

        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(9);

        this.time.delayedCall(1500, () => {
            if (!this.isActive) return;
            this.yearCounter.setAlpha(1);
            this.animateYearCounter();
        });
    }

    /**
     * Cria os personagens na cena
     */
    private createCharacters(): void {
        const { width, height } = this.cameras.main;
        
        // Personagem principal
        this.character = this.add.image(-80, height * 0.65, 'character')
            .setScale(this.CHARACTER_SCALE);
            
        // Personagem xumbro
        this.xumbro = this.add.image(width + 80, height * 0.65, 'xumbro')
            .setScale(this.CHARACTER_SCALE);

        // Animação de entrada do personagem principal
        this.time.delayedCall(1500, () => {
            if (!this.isActive) return;
            this.tweens.add({
                targets: this.character,
                x: width * 0.15,
                duration: 1000,
                ease: 'Expo.easeOut'
            });
        });

        // Animação de entrada do xumbro
        this.time.delayedCall(2000, () => {
            if (!this.isActive) return;
            this.tweens.add({
                targets: this.xumbro,
                x: width * 0.85,
                duration: 1000,
                ease: 'Expo.easeOut'
            });
        });
    }

    /**
     * Cria o texto de iniciar
     */
    private createStartText(): void {
        const { width, height } = this.cameras.main;
        
        this.startText = this.add.text(width / 2, height * 0.85, 'APERTE ESPAÇO', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#1a3300',
            backgroundColor: '#ffff00',
            padding: { x: 10, y: 5 },
            fixedWidth: 150,
            fixedHeight: 25,
            align: 'center'
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(10);
        
        // Aguardar a entrada dos outros elementos antes de mostrar o texto
        this.time.delayedCall(3500, () => {
            if (!this.isActive) return;
        
        // Animação de piscar
        this.tweens.add({
            targets: this.startText,
            alpha: { from: 0, to: 1 },
            duration: 800,
            repeat: -1,
            yoyo: true
            });
        });
    }

    /**
     * Configura a música de fundo
     */
    private setupMusic(): void {
        try {
            this.menuMusic = this.sound.add('menuMusic', { 
                volume: this.MUSIC_VOLUME, 
                loop: true 
            });
            this.menuMusic.play();
        } catch (error) {
            console.error('Erro ao iniciar a música:', error);
        }
    }

    /**
     * Configura os controles de teclado
     */
    private setupControls(): void {
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-SPACE', () => {
                if (!this.isActive || this.isTransitioning) return;
            this.transitionToNextScene();
        });
    }
    }
            
    /**
     * Transição para a próxima cena
     */
    private transitionToNextScene(): void {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Efeito de flash na câmera
            this.cameras.main.flash(500, 255, 255, 0);
            
        // Fade out de todos os elementos
            this.tweens.add({
            targets: [this.background, this.title, this.startText, 
                     this.character, this.xumbro],
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                if (this.menuMusic) {
                    this.menuMusic.stop();
                }
                    this.scene.start('VideoScene');
                }
            });
    }

    /**
     * Anima o contador de anos
     */
    private animateYearCounter(): void {
        const duration = 2000;
        const steps = 50;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const update = () => {
            if (!this.isActive) return;
            
            currentStep++;
            const progress = currentStep / steps;
            this.yearValue = Math.floor(progress * this.TARGET_YEAR);
            
            if (this.yearCounter) {
            this.yearCounter.setText(this.yearValue.toString().padStart(4, '0'));

                // Efeito de glitch ocasional
            if (Math.random() > 0.7) {
                this.yearCounter.setTint(0xff00ff);
                    this.time.delayedCall(50, () => {
                        if (this.yearCounter && this.isActive) {
                            this.yearCounter.clearTint();
                        }
                    });
                }
            }

            if (currentStep < steps) {
                this.time.delayedCall(stepDuration, update);
            } else if (this.isActive) {
                // Efeito final
                this.cameras.main.shake(30, 0.005);
                
                if (this.yearCounter) {
                this.yearCounter.setTint(0x00ff77);
                    this.time.delayedCall(100, () => {
                        if (this.yearCounter && this.isActive) {
                            this.yearCounter.clearTint();
                        }
                    });
                }
            }
        };

        update();
            }

    /**
     * Manipula o redimensionamento da tela
     */
    private handleResize(): void {
        if (!this.isActive || !this.cameras?.main) return;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Reposicionar elementos
        this.background?.setPosition(width / 2, height / 2).setDisplaySize(width, height);
        this.title?.setPosition(width / 2, height * 0.15);
        this.yearCounter?.setPosition(width / 2, height * 0.30);
        this.character?.setPosition(width * 0.15, height * 0.65);
        this.xumbro?.setPosition(width * 0.85, height * 0.65);
        this.startText?.setPosition(width / 2, height * 0.85);
        
        // Atualizar tamanho do scanline
        this.scanline?.setSize(width, 1);
        this.scanlineGlow?.setSize(width, 2);
    }

    /**
     * Chamado ao desligar a cena
     */
    shutdown(): void {
        this.isActive = false;
        this.isTransitioning = false;
        
        // Remover event listeners
        this.scale.off('resize', this.handleResize, this);
        
        // Parar música
        if (this.menuMusic) {
        this.menuMusic.stop();
        }
        
        // Limpar todos os temporizadores ativos
        this.time.removeAllEvents();
    }
} 