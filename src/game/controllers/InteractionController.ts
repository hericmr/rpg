import { Scene, GameObjects, Physics } from 'phaser';
import { DialogBox } from '../components/DialogBox';
import { InteractionMenu } from '../components/InteractionMenu';

export interface InteractionPoint {
    x: number;
    y: number;
    dialog: string;
    type?: string;
    requiredClearance?: string;
    options?: {
        label: string;
        onSelect: () => void;
    }[];
}

export class InteractionController {
    private scene: Scene;
    private interactionPoints: InteractionPoint[];
    private dialogActive: boolean;
    private currentDialog?: DialogBox;
    private readonly interactionDistance: number = 50;
    private jblState: {
        isOn: boolean;
        isBluetoothEnabled: boolean;
    } = {
        isOn: false,
        isBluetoothEnabled: false
    };
    private currentMenu?: InteractionMenu;

    constructor(scene: Scene) {
        this.scene = scene;
        this.interactionPoints = [];
        this.dialogActive = false;
    }

    public addInteractionPoints(points: InteractionPoint[]): void {
        this.interactionPoints = points;
    }

    public checkInteractions(playerSprite: Physics.Arcade.Sprite, playerClearance: string): void {
        if (this.dialogActive || !this.scene.input.keyboard) return;

        const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        if (!spaceKey.isDown) return;

        const playerBounds = playerSprite.getBounds();

        for (const point of this.interactionPoints) {
            const distance = Phaser.Math.Distance.Between(
                playerBounds.centerX,
                playerBounds.centerY,
                point.x,
                point.y
            );

            if (distance <= this.interactionDistance) {
                if (point.requiredClearance && point.requiredClearance !== playerClearance) {
                    this.showDialog("Acesso negado. Nível de autorização insuficiente.");
                } else {
                    // Se for a JBL, mostrar diálogo com opções
                    if (point.dialog.includes('JBL')) {
                        this.showJBLDialog();
                    } else {
                        this.handleLook(point);
                    }
                }
                break;
            }
        }
    }

    private showJBLDialog(): void {
        const dialog = this.jblState.isOn 
            ? "JBL está ligada. O que você quer fazer?"
            : "Caraca essa JBL depois do overclock ficou bem forte potente. O que você quer fazer?";

        const options = [
            {
                label: this.jblState.isOn ? "Desligar" : "Ligar",
                onSelect: () => {
                    this.jblState.isOn = !this.jblState.isOn;
                    this.showJBLDialog();
                }
            }
        ];

        if (this.jblState.isOn) {
            options.push({
                label: this.jblState.isBluetoothEnabled ? "Desativar Bluetooth" : "Ativar Bluetooth",
                onSelect: () => {
                    this.jblState.isBluetoothEnabled = !this.jblState.isBluetoothEnabled;
                    this.showJBLDialog();
                }
            });
        }

        this.showDialog(dialog, {
            isPlayerThought: false,
            name: "JBL",
            color: 0xe43675,
            options: options
        });
    }

    public showDialog(
        dialog: string,
        options: {
            isPlayerThought?: boolean;
            portrait?: string;
            name?: string;
            color?: number;
            options?: {
                label: string;
                onSelect: () => void;
            }[];
        } = {}
    ): void {
        if (this.dialogActive) return;

        this.dialogActive = true;
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        const x = screenWidth / 2;
        const y = screenHeight - (screenHeight * 0.15);

        this.currentDialog = new DialogBox({
            scene: this.scene,
            x,
            y,
            width: screenWidth * 0.9,
            height: screenHeight * 0.3,
            dialog,
            portrait: options.portrait,
            name: options.name,
            dialogColor: options.color ?? 0xe43675,
            textColor: '#FFFFFF',
            options: options.options,
            onClose: () => {
                this.dialogActive = false;
                this.currentDialog = undefined;
            }
        });
    }

    public closeDialog(): void {
        if (this.currentDialog) {
            this.currentDialog.close();
            this.currentDialog = undefined;
        }
        this.dialogActive = false;
    }

    public isDialogActive(): boolean {
        return this.dialogActive;
    }

    private handleLook(point: InteractionPoint): void {
        let message = '';
        switch (point.type) {
            case 'jbl':
                message = 'Uma JBL portátil com overclock, superpotente, apliquei um pouco de graxa e agora atinge 9999 decibeis';
                break;
            case 'lion':
                message = 'dr lion um npc muito legal.';
                break;
            default:
                message = 'Você olha atentamente, mas não vê nada de especial.';
        }
        this.showDialog(message, {
            portrait: 'player_portrait',
            name: 'Você',
            color: 0x1a237e
        });
    }
} 