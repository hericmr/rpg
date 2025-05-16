import { Scene } from 'phaser';
import { DialogBox } from './DialogBox';

export class InitialDialog {
    private scene: Scene;
    private dialogBox: DialogBox | null = null;
    private exitKeys: Phaser.Input.Keyboard.Key[] = [];

    constructor(scene: Scene) {
        this.scene = scene;

        // Define as teclas de saída (ESPAÇO e ESC)
        if (this.scene.input?.keyboard) {
            this.exitKeys = [
                this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
                this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
            ];
        }
    }

    public show(): void {
        // Configurações da caixa de diálogo
        const config = {
            scene: this.scene,
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 90,
            width: this.scene.cameras.main.width * 0.9,
            height: 140,
            dialog:
                "\n     acorda com uma dor de cabeça lancinante e amnésia,\n" +
                " não se lembra de nada que aconteceu no dia anterior..." ,
            dialogColor: 0x0d1642,
            portrait: 'player_portrait',
            name: 'Você',
            portraitScale: 3,
            textColor: '#FFFFFF',
            autoClose: false
        };

        this.dialogBox = new DialogBox(config);

        // Monitora teclas para encerrar o diálogo
        if (this.scene.input?.keyboard) {
            this.scene.input.keyboard.on('keydown', this.handleExitKey, this);
        }
    }

    private handleExitKey(event: KeyboardEvent): void {
        if (this.dialogBox && (event.code === 'Escape' || event.code === 'Space')) {
            this.destroy();
        }
    }

    public isActive(): boolean {
        return this.dialogBox !== null;
    }

    public destroy(): void {
        if (this.dialogBox) {
            this.dialogBox.close();
            this.dialogBox = null;

            // Remove o listener para evitar múltiplas instâncias
            if (this.scene.input?.keyboard) {
                this.scene.input.keyboard.off('keydown', this.handleExitKey, this);
            }
        }
    }
} 