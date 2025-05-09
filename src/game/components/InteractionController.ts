import { Scene } from 'phaser';
import { DialogBox } from './DialogBox';
import { InteractionMenu } from './InteractionMenu';

interface InteractionPoint {
    x: number;
    y: number;
    radius: number;
    type: string;
    data?: {
        isOn?: boolean;
        [key: string]: any;
    };
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
                icon: '👄',
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
            },
            {
                icon: '🚪',
                label: 'Sair',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Sair" selecionada.');
                    this.currentMenu?.close();
                    this.isInteracting = false;
                }
            }
        ];

        let title = '';
        switch (point.type) {
            case 'jbl':
                title = 'JBL';
                break;
            case 'lion':
                title = 'Lion';
                break;
            default:
                title = 'Objeto';
        }
        this.currentMenu = new InteractionMenu({
            scene: this.scene,
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 60,
            options,
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
        if (point.type === 'jbl') {
            const isOn = point.data?.isOn ?? false;
            const message = isOn
                ? 'Uma JBL portátil com overclock, superpotente, apliquei um pouco de graxa e agora atinge 9999 decibeis. Está ligada!'
                : 'JBL portátil com overclock, superpotente, apliquei graxa e agora atinge 99 mil decibeis.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'lion') {
            this.showDialog('dr lion um npc muito legal.');
            return;
        }

        this.showDialog('Você olha atentamente, mas não vê nada de especial.');
    }

    private handlePick(point: InteractionPoint): void {
        if (point.type === 'jbl') {
            if (!point.data) point.data = {};
            point.data.isOn = !point.data.isOn;

            const stateMsg = point.data.isOn
                ? 'Bluetooth ativado! A JBL agora está ligada e vai fazer o chão tremer!'
                : 'Bluetooth desativado! A JBL foi desligada.';
            
            this.showDialog(stateMsg);
            return;
        }

        this.showDialog('Você não consegue pegar isso.');
    }

    private handleTalk(point: InteractionPoint): void {
        if (point.type === 'jbl') {
            const isOn = point.data?.isOn ?? false;
            const message = isOn
                ? 'Essa jbl ficou braba demais depois do overclock e de eu ter passado graxa nas engrenagens... .'
                : 'A JBL está, aguardando um comando.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'lion') {
            this.showDialog('dorme como pedra, mas ela não responde.');
            return;
        }

        this.showDialog('Não há ninguém para conversar aqui.');
    }

    private handleKick(point: InteractionPoint): void {
        if (point.type === 'jbl') {
            const isOn = point.data?.isOn ?? false;
            const message = isOn
                ? 'Não tem pra que chutar, ela já está ligada.'
                : 'Essa JBL está muito alta para chutar.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'lion') {
            this.showDialog('Você chuta o Lion. Seu pé dói, mas ele continua dormindo.');
            return;
        }

        this.showDialog('Você chuta o ar.');
    }

    private showDialog(message: string): void {
        if (this.currentDialog) {
            this.currentDialog.close();
        }
        console.log('[InteractionController] Abrindo diálogo:', message);
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        this.currentDialog = new DialogBox({
            scene: this.scene,
            x: screenWidth / 2,
            y: screenHeight - 90, // Posiciona mais próximo da parte inferior
            width: screenWidth * 1, // Usa 90% da largura da tela
            height: 120, // Altura fixa para o diálogo
            dialog: message,
            portrait: 'player_portrait',
            name: 'Você',
            dialogColor: 0x1a237e,
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