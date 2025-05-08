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

        // Configurar a câmera para evitar tremulação
        this.cameras.main.setRoundPixels(true);
        
        // Criar vídeo com configurações otimizadas
        this.video = this.add.video(screenWidth / 2, screenHeight / 2, 'introVideo');
        
        // Calcular dimensões do vídeo mantendo a proporção
        const videoAspectRatio = 16 / 9; // Assumindo proporção 16:9
        let videoWidth = screenWidth * 0.8;
        let videoHeight = videoWidth / videoAspectRatio;
        
        // Ajustar se a altura for muito grande
        if (videoHeight > screenHeight * 0.8) {
            videoHeight = screenHeight * 0.8;
            videoWidth = videoHeight * videoAspectRatio;
        }
        
        // Aplicar dimensões e configurações de renderização
        this.video.setDisplaySize(videoWidth, videoHeight);
        this.video.setOrigin(0.5);
        this.video.setPipeline('TextureTintPipeline');
        
        // Adicionar texto de skip com estilo cyberpunk
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

        // Adicionar animação de fade in/out ao texto de skip
        this.tweens.add({
            targets: this.skipText,
            alpha: { from: 0, to: 1 },
            duration: 800,
            repeat: -1,
            yoyo: true
        });

        // Iniciar vídeo com fade in
        this.cameras.main.fadeIn(500);
        this.video.play();

        // Configurar interatividade
        this.skipText.setInteractive();
        this.skipText.on('pointerdown', () => {
            this.cameras.main.flash(500, 0, 255, 0);
            this.video.stop();
            this.scene.start('GameScene');
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.cameras.main.flash(500, 0, 255, 0);
            this.video.stop();
            this.scene.start('GameScene');
        });

        // Lidar com a conclusão do vídeo
        this.video.on('complete', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene');
            });
        });

        // Lidar com redimensionamento da janela
        this.scale.on('resize', this.handleResize, this);
    }

    private handleResize(): void {
        const newWidth = this.cameras.main.width;
        const newHeight = this.cameras.main.height;
        
        // Recalcular dimensões do vídeo
        const videoAspectRatio = 16 / 9;
        let videoWidth = newWidth * 0.8;
        let videoHeight = videoWidth / videoAspectRatio;
        
        if (videoHeight > newHeight * 0.8) {
            videoHeight = newHeight * 0.8;
            videoWidth = videoHeight * videoAspectRatio;
        }
        
        this.video.setPosition(newWidth / 2, newHeight / 2);
        this.video.setDisplaySize(videoWidth, videoHeight);
        
        this.skipText.setPosition(newWidth - 10, newHeight - 10);
    }
} 