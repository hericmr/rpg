import { Scene } from 'phaser';
import { DialogBox } from './DialogBox';
import { InteractionMenu } from './InteractionMenu';

interface InteractionPoint {
    x: number;
    y: number;
    radius: number;
    type: string;
    data?: any;
}

export class InteractionController {
    private scene: Scene;
    private interactionPoints: InteractionPoint[] = [];
    private currentDialog: DialogBox | null = null;
    private currentMenu: InteractionMenu | null = null;
    private spaceKey: Phaser.Input.Keyboard.Key;
    private isInteracting: boolean = false;

    constructor(scene: Scene) {
        this.scene = scene;
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) {
            throw new Error('Keyboard input not available');
        }
        this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Configurar listener para a tecla espaço
        this.spaceKey.on('down', () => {
            if (this.isInteracting) {
                console.log('[InteractionController] Já está interagindo, menu não será aberto.');
                return;
            }
            
            const player = this.scene.children.list.find(child => 
                child instanceof Phaser.GameObjects.Sprite && 
                child.getData('type') === 'player'
            ) as Phaser.GameObjects.Sprite;

            if (!player) {
                console.log('[InteractionController] Jogador não encontrado.');
                return;
            }

            const playerX = player.x;
            const playerY = player.y;

            const nearbyPoint = this.interactionPoints.find(point => {
                const distance = Phaser.Math.Distance.Between(
                    playerX, playerY,
                    point.x, point.y
                );
                return distance <= point.radius;
            });

            if (nearbyPoint) {
                console.log('[InteractionController] Ponto de interação próximo detectado:', nearbyPoint);
                this.showInteractionMenu(nearbyPoint);
            } else {
                console.log('[InteractionController] Nenhum ponto de interação próximo.');
            }
        });
    }

    private showInteractionMenu(point: InteractionPoint): void {
        if (this.currentMenu) {
            this.currentMenu.close();
        }

        this.isInteracting = true;
        console.log('[InteractionController] Abrindo menu de interação para o ponto:', point);
        const options = [
            {
                icon: '👁️',
                label: 'Olhar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Olhar" selecionada.');
                    this.currentMenu?.close(); 
                    this.showDialogOption(() => this.handleLook(point)); 
                }
            },
            {
                icon: '✋',
                label: 'Usar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "usar" selecionada.');
                    this.currentMenu?.close(); 
                    this.showDialogOption(() => this.handlePick(point)); 
                }
            },
            {
                icon: '💬',
                label: 'Falar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Falar" selecionada.');
                    this.currentMenu?.close(); 
                    this.showDialogOption(() => this.handleTalk(point)); 
                }
            },
            {
                icon: '👢',
                label: 'Chutar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Chutar" selecionada.');
                    this.currentMenu?.close(); 
                    this.showDialogOption(() => this.handleKick(point)); 
                }
            }
        ];

        let title = '';
        switch (point.type) {
            case 'jbl':
                title = 'JBL';
                break;
            case 'lion':
                title = 'Leão';
                break;
            default:
                title = 'Objeto';
        }
        this.currentMenu = new InteractionMenu({
            scene: this.scene,
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 60,
            options,
            portrait: 'player_portrait',
            title,
            onClose: () => {
                this.isInteracting = false;
                this.currentMenu = null;
            }
        });
    }

    // Função auxiliar para garantir que o diálogo só abre após o menu fechar
    private showDialogOption(action: () => void): void {
        // Pequeno delay para garantir que o menu foi fechado visualmente
        this.scene.time.delayedCall(50, () => {
            action();
        });
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
        this.showDialog(message);
    }

    private handlePick(point: InteractionPoint): void {
        let message = '';
        switch (point.type) {
            case 'jbl':
                message = 'blue tooth ativado! a JBL ja pode ser usada.';
                break;
            default:
                message = 'Você não consegue pegar isso.';
        }
        this.showDialog(message);
    }

    private handleTalk(point: InteractionPoint): void {
        let message = '';
        switch (point.type) {
            case 'jbl':
                message = 'A JBL parece estar em modo de espera.';
                break;
            case 'lion':
                message = 'Você tenta conversar com a estátua, mas ela não responde.';
                break;
            default:
                message = 'Não há ninguém para conversar aqui.';
        }
        this.showDialog(message);
    }

    private handleKick(point: InteractionPoint): void {
        let message = '';
        switch (point.type) {
            case 'jbl':
                message = 'Essa JBL está muito alta para chutar.';
                break;
            case 'lion':
                message = 'Você chuta o Lion. Seu pé dói, mas ele continua dormindo.';
                break;
            default:
                message = 'Você chuta o ar.';
        }
        this.showDialog(message);
    }

    private showDialog(message: string): void {
        if (this.currentDialog) {
            this.currentDialog.close();
        }
        console.log('[InteractionController] Abrindo diálogo:', message);
        this.currentDialog = new DialogBox({
            scene: this.scene,
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 100,
            width: 400,
            height: 100,
            dialog: message,
            onClose: () => {
                this.isInteracting = false;
                this.currentDialog = null;
                console.log('[InteractionController] Diálogo fechado.');
            }
        });
        // isInteracting já está true desde o menu
    }

    public addInteractionPoint(point: InteractionPoint): void {
        this.interactionPoints.push(point);
    }

    public removeInteractionPoint(x: number, y: number): void {
        this.interactionPoints = this.interactionPoints.filter(point => 
            point.x !== x || point.y !== y
        );
    }

    public update(): void {
        // Atualizar lógica se necessário
    }
} 