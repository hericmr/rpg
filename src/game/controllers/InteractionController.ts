import { Scene, GameObjects, Physics } from 'phaser';
import { DialogBox } from '../components/DialogBox';
import { InteractionMenu } from '../components/InteractionMenu';

export interface InteractionPoint {
    x: number;
    y: number;
    radius: number;
    type: string;
    dialog?: string;
    requiredClearance?: string;
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
    private spaceKey: Phaser.Input.Keyboard.Key | null = null;
    private isInteracting: boolean = false;
    private readonly interactionDistance: number = 50;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private currentInteractionPoint: InteractionPoint | null = null;
    
    private jblState: {
        isOn: boolean;
        isBluetoothEnabled: boolean;
    } = {
        isOn: false,
        isBluetoothEnabled: false
    };
    
    private computerState: {
        isOn: boolean;
        isHacked: boolean;
    } = {
        isOn: false,
        isHacked: false
    };

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public init(): void {
        if (!this.scene.input?.keyboard) {
            console.warn('[InteractionController] Keyboard not available, retrying in 100ms...');
            this.scene.time.delayedCall(100, () => this.init());
            return;
        }

        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
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
                return distance <= (point.radius || this.interactionDistance);
            });

            if (nearbyPoint) {
                console.log('[InteractionController] Ponto de interação próximo detectado:', nearbyPoint);
                if (nearbyPoint.requiredClearance && nearbyPoint.requiredClearance !== player.getData('clearance')) {
                    this.showDialog("Acesso negado. Nível de autorização insuficiente.");
                } else {
                    this.showInteractionMenu(nearbyPoint);
                }
            } else {
                console.log('[InteractionController] Nenhum ponto de interação próximo.');
            }
        });
    }

    private stopMusic(): void {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = null;
        }
    }

    private showInteractionMenu(point: InteractionPoint): void {
        if (this.currentMenu) {
            this.currentMenu.close();
        }

        this.currentInteractionPoint = point;
        this.isInteracting = true;
        console.log('[InteractionController] Abrindo menu de interação para o ponto:', point);
        const options = [
            {
                icon: '👁️',
                label: 'Olhar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Olhar" selecionada.');
                    this.currentMenu?.close(); 
                    this.handleLook(point); 
                }
            },
            {
                icon: '✋',
                label: 'Usar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Usar" selecionada.');
                    this.currentMenu?.close(); 
                    this.handlePick(point); 
                }
            },
            {
                icon: '👄',
                label: 'Falar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Falar" selecionada.');
                    this.currentMenu?.close(); 
                    this.handleTalk(point); 
                }
            },
            {
                icon: '👢',
                label: 'Chutar',
                onSelect: () => { 
                    console.log('[InteractionController] Opção "Chutar" selecionada.');
                    this.currentMenu?.close(); 
                    this.handleKick(point); 
                }
            }
        ];

        // Adicionar opção "Tocar música" se o computador estiver hackeado e a JBL ligada
        if (point.type === 'computador' && this.computerState.isHacked && this.jblState.isOn) {
            options.push({
                icon: '🎵',
                label: 'Tocar música',
                onSelect: () => {
                    console.log('[InteractionController] Opção "Tocar música" selecionada.');
                    
                    // Parar música anterior se existir
                    this.stopMusic();
                    
                    // Tocar o áudio
                    this.currentMusic = this.scene.sound.add('techno', {
                        volume: 0.8,
                        loop: true
                    });
                    this.currentMusic.play();
                    
                    // Fechar o menu imediatamente
                    this.currentMenu?.close();
                    this.currentMenu = null;
                    
                    // Mostrar diálogo e configurar para fechar automaticamente
                    this.showDialog('A JBL começa a tocar um som ensurdecedor de techno industrial!', {
                        dialogColor: 0xff0000, // Vermelho para indicar a intensidade do som
                        autoClose: true, // Indica que o diálogo deve fechar automaticamente
                        noMenuReturn: true // Impede que o menu reabra após o diálogo
                    });
                }
            });
        }

        // Adicionar opção "Sair" sempre por último
        options.push({
            icon: '🚪',
            label: 'Sair',
            onSelect: () => { 
                console.log('[InteractionController] Opção "Sair" selecionada.');
                this.currentMenu?.close();
                this.isInteracting = false;
            }
        });

        let title = '';
        switch (point.type) {
            case 'jbl':
                title = 'JBL';
                break;
            case 'lion':
                title = 'Lion';
                break;
            case 'computador':
                title = 'Computador';
                break;
            case 'telescopio':
                title = 'Telescópio';
                break;
            case 'vaso':
                title = 'Vaso';
                break;
            default:
                title = point.type || 'Objeto';
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

    private handleLook(point: InteractionPoint): void {
        if (point.type === 'jbl') {
            const isOn = point.data?.isOn ?? this.jblState.isOn;
            const message = isOn
                ? 'Uma JBL com overclock, superpotente, apliquei um pouco de graxa e agora atinge 9999 decibeis. Está ligada!'
                : 'JBL com overclock, superpotente... atinge 99 mil decibeis.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'computador') {
            const message = this.computerState.isOn
                ? this.computerState.isHacked
                    ? 'O computador está ligado e hackeado. A tela mostra várias janelas de terminal abertas.'
                    : 'O computador está ligado. A tela pede uma senha.'
                : 'Um computador antigo. Parece que ainda funciona.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'lion') {
            this.showDialog('dr lion um npc muito legal.');
            return;
        }

        if (point.dialog) {
            this.showDialog(point.dialog);
            return;
        }

        this.showDialog('Você olha atentamente, mas não vê nada de especial.');
    }

    private handlePick(point: InteractionPoint): void {
        if (point.type === 'jbl') {
            this.jblState.isOn = !this.jblState.isOn;
            if (!point.data) point.data = {};
            point.data.isOn = this.jblState.isOn;

            if (!this.jblState.isOn) {
                this.stopMusic();
            }

            const stateMsg = this.jblState.isOn
                ? 'Ligando... Bluetooth ativado! Essa JBL agora tá ligada... faz até o chão tremer!'
                : 'Bluetooth desativado! A JBL foi desligada.';
            
            this.showDialog(stateMsg);
            return;
        }

        if (point.type === 'computador') {
            this.computerState.isOn = !this.computerState.isOn;
            const message = this.computerState.isOn
                ? 'Você liga o computador. A tela pisca e mostra uma tela de login.'
                : 'Você desliga o computador.';
            this.showDialog(message);
            return;
        }

        this.showDialog('Você não consegue pegar isso.');
    }

    private handleTalk(point: InteractionPoint): void {
        if (point.type === 'jbl') {
            const isOn = point.data?.isOn ?? this.jblState.isOn;
            const message = isOn
                ? 'Essa jbl ficou braba demais depois de eu ter passado graxa nas engrenagens...'
                : 'A JBL está aguardando um comando.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'computador') {
            if (!this.computerState.isOn) {
                this.showDialog('O computador está desligado.');
                return;
            }

            if (!this.computerState.isHacked) {
                this.showDialog('Você tenta falar com o computador, mas ele não responde. Talvez seja necessário hackear o sistema primeiro.');
                return;
            }

            this.showDialog('O computador responde com uma voz robótica: "Sistema online. Como posso ajudar?"');
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
            const isOn = point.data?.isOn ?? this.jblState.isOn;
            const message = isOn
                ? 'Não tem pra que chutar, ela já está ligada.'
                : 'Essa JBL está num lugar muito alto para chutar.';
            this.showDialog(message);
            return;
        }

        if (point.type === 'computador') {
            if (this.computerState.isOn) {
                this.computerState.isHacked = true;
                this.showDialog('Você chuta o computador. A tela pisca e várias janelas de terminal se abrem. O sistema foi hackeado!', {
                    noMenuReturn: true // Impede que o menu reabra após hackear o computador
                });
            } else {
                this.showDialog('Você chuta o computador desligado. Nada acontece.');
            }
            return;
        }

        if (point.type === 'lion') {
            this.showDialog('Você chuta o Lion. Seu pé dói, mas ele continua dormindo.');
            return;
        }

        this.showDialog('Você chuta o ar.');
    }

    public showDialog(
        message: string,
        options: {
            isPlayerThought?: boolean;
            portrait?: string;
            name?: string;
            dialogColor?: number;
            options?: {
                label: string;
                onSelect: () => void;
            }[];
            autoClose?: boolean;
            noMenuReturn?: boolean;
        } = {}
    ): void {
        // Fecha o menu antes de mostrar o diálogo
        if (this.currentMenu) {
            this.currentMenu.close();
            this.currentMenu = null;
        }

        // Fecha o diálogo anterior se existir
        if (this.currentDialog) {
            this.currentDialog.close();
        }

        console.log('[InteractionController] Abrindo diálogo:', message);
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        this.currentDialog = new DialogBox({
            scene: this.scene,
            x: screenWidth / 2,
            y: screenHeight - 90,
            width: screenWidth * 0.9,
            height: 120,
            dialog: message,
            portrait: options.portrait || 'player_portrait',
            name: options.name || 'Você',
            dialogColor: options.dialogColor || 0x1a237e,
            options: options.options,
            autoClose: options.autoClose,
            onClose: () => {
                this.isInteracting = false;
                this.currentDialog = null;
                console.log('[InteractionController] Diálogo fechado.');

                if (!options.autoClose && !options.noMenuReturn && this.currentInteractionPoint) {
                    this.showInteractionMenu(this.currentInteractionPoint);
                }
            }
        });

        // Garante que o diálogo apareça por cima com uma profundidade alta
        if (this.currentDialog) {
            this.scene.children.bringToTop(this.currentDialog as any);
        }
    }

    public checkInteractions(playerSprite: Physics.Arcade.Sprite, playerClearance: string): void {
        if (this.isInteracting || !this.spaceKey?.isDown) return;

        const playerBounds = playerSprite.getBounds();

        for (const point of this.interactionPoints) {
            const distance = Phaser.Math.Distance.Between(
                playerBounds.centerX,
                playerBounds.centerY,
                point.x,
                point.y
            );

            if (distance <= (point.radius || this.interactionDistance)) {
                if (point.requiredClearance && point.requiredClearance !== playerClearance) {
                    this.showDialog("Acesso negado. Nível de autorização insuficiente.");
                } else {
                    this.showInteractionMenu(point);
                }
                break;
            }
        }
    }

    public addInteractionPoint(point: InteractionPoint): void {
        this.interactionPoints.push(point);
    }

    public addInteractionPoints(points: InteractionPoint[]): void {
        this.interactionPoints = this.interactionPoints.concat(points);
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