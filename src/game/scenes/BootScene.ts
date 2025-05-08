import { Scene, GameObjects } from 'phaser';

export default class BootScene extends Scene {
    private morphingSprite!: GameObjects.Sprite;
    private copyrightText!: GameObjects.Text;

    constructor() {
        super({ key: 'BootScene' });
    }

    preload(): void {
        const publicUrl = process.env.PUBLIC_URL || '';
        this.load.image('menu', `${publicUrl}/assets/menu.png`);
        this.load.audio('msc', `${publicUrl}/assets/eletronic.ogg`);
        
        // Carregar a sequência de frames
        for (let i = 0; i <= 49; i++) {
            const frameNumber = i.toString().padStart(3, '0');
            this.load.image(`frame_${frameNumber}`, `${publicUrl}/assets/frames/frame_${frameNumber}.png`);
        }
    }

    create(): void {
        // Configurar fundo preto
        this.cameras.main.setBackgroundColor('#000000');

        // Criar sprite do morphing
        this.morphingSprite = this.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'frame_000'
        );
        this.morphingSprite.setAlpha(0);
        this.morphingSprite.setScale(0.3);

        // Criar animação do morphing
        const frameNames = [];
        // Primeiro frame (3 segundos, só uma vez)
        for (let i = 0; i < 72; i++) { // 3 segundos * 24fps = 72 frames
            frameNames.push({ key: 'frame_000' });
        }
        // Frames intermediários (velocidade normal)
        for (let i = 1; i <= 48; i++) {
            const frameNumber = i.toString().padStart(3, '0');
            frameNames.push({ key: `frame_${frameNumber}` });
        }
        // Último frame (3 segundos)
        for (let i = 0; i < 172; i++) { // 3 segundos * 24fps = 72 frames
            frameNames.push({ key: 'frame_049' });
        }

        this.anims.create({
            key: 'morph',
            frames: frameNames,
            frameRate: 24,
            repeat: 0 // Não repetir a animação
        });

        // Criar uma segunda animação para o loop
        const loopFrameNames = [];
        for (let i = 1; i <= 48; i++) {
            const frameNumber = i.toString().padStart(3, '0');
            loopFrameNames.push({ key: `frame_${frameNumber}` });
        }
        for (let i = 0; i < 72; i++) {
            loopFrameNames.push({ key: 'frame_049' });
        }

        this.anims.create({
            key: 'morphLoop',
            frames: loopFrameNames,
            frameRate: 24,
            repeat: -1 // Repetir infinitamente
        });

        this.copyrightText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 55,
            'Papai Lion\nIndie Games\n\nTODOS OS DIREITOS RESERVADOS',
            {
                fontFamily: 'monospace',
                fontSize: '8px',
                color: '#FFFFFF',
                align: 'center'
            }
        );
        this.copyrightText.setOrigin(0.5);
        this.copyrightText.setAlpha(-3);

        // Iniciar sequência de animação
        this.showMorphing();
    }

    private showMorphing(): void {
        // Fade in do morphing e iniciar animação
        this.tweens.add({
            targets: this.morphingSprite,
            alpha: 1,
            duration: 2000,
            onComplete: () => {
                this.morphingSprite.play('morph');
                // Quando a primeira animação terminar, iniciar o loop
                this.morphingSprite.on('animationcomplete', () => {
                    this.morphingSprite.play('morphLoop');
                });
                this.showCopyright();
            }
        });
    }

    private showCopyright(): void {
        // Fade in do copyright
        this.tweens.add({
            targets: this.copyrightText,
            alpha: 1,
            duration: 1000,
            delay: 1000
        });

        // Fade out do morphing e copyright
        this.tweens.add({
            targets: [this.morphingSprite, this.copyrightText],
            alpha: 0,
            duration: 2000,
            delay: 5000
        });

        // Após a sequência completa, carregar o menu principal
        this.time.delayedCall(9000, () => {
            this.scene.start('MenuScene');
        });
    }
} 