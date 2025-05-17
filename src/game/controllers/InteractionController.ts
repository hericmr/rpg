import { Scene } from 'phaser';
import { DialogBox } from '../components/DialogBox';
import { InteractionMenu } from '../components/InteractionMenu';
import { ESTADOS_DISPOSITIVOS, MUSICAS_REVOLUCIONARIAS, MENSAGENS_CONQUISTA, SongInfo } from '../config/estadosTransitorios';
import GameState, { JBLDeviceState, ComputerDeviceState, MusicState } from '../state/GameState';
import { PlayerController } from './PlayerController';
import { MenuManager } from '../components/menu/MenuManager';
import { registerDefaultMenus } from '../components/menu/DefaultMenus';
import { TelescopeView } from '../components/TelescopeView';

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

export default class InteractionController {
    private scene: Scene;
    private interactionPoints: InteractionPoint[] = [];
    private currentDialog: DialogBox | null = null;
    private currentMenu: InteractionMenu | null = null;
    private spaceKey: Phaser.Input.Keyboard.Key | null = null;
    private enterKey: Phaser.Input.Keyboard.Key | null = null;
    private backspaceKey: Phaser.Input.Keyboard.Key | null = null;
    private escapeKey: Phaser.Input.Keyboard.Key | null = null;
    private isInteracting: boolean = false;
    private readonly interactionDistance: number = 50;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private currentInteractionPoint: InteractionPoint | null = null;
    private gameState: GameState;
    private isInitialized: boolean = false;
    private playerController: PlayerController;
    private currentPasswordInput: string = '';
    private isEnteringPassword: boolean = false;
    private upKey: Phaser.Input.Keyboard.Key | null = null;
    private downKey: Phaser.Input.Keyboard.Key | null = null;
    private escKey: Phaser.Input.Keyboard.Key | null = null;
    private menuManager: MenuManager;

    constructor(scene: Scene, playerController: PlayerController) {
        this.scene = scene;
        this.playerController = playerController;
        this.gameState = GameState.getInstance();
        this.menuManager = MenuManager.getInstance();
        this.menuManager.setScene(scene);
        this.menuManager.setOnMenuClosed(() => {
            console.log('[InteractionController] Menu closed, cleaning up state');
            this.isInteracting = false;
            this.playerController.setDialogActive(false);
            this.currentInteractionPoint = null;
        });
        registerDefaultMenus(this.gameState);
    }

    private get jblState(): JBLDeviceState {
        return this.gameState.jblState;
    }

    private set jblState(newState: JBLDeviceState) {
        this.gameState.jblState = newState;
    }

    private get computerState(): ComputerDeviceState {
        return this.gameState.computerState;
    }

    private set computerState(newState: ComputerDeviceState) {
        this.gameState.computerState = newState;
    }

    private get musicState(): MusicState {
        return this.gameState.musicState;
    }

    private set musicState(newState: MusicState) {
        this.gameState.musicState = newState;
    }

    private get isPaired(): boolean {
        return this.gameState.isPaired;
    }

    private set isPaired(value: boolean) {
        this.gameState.isPaired = value;
    }

    public init(): void {
        console.log('[InteractionController] Initializing...');
        
        // Reset state
        this.isInitialized = false;
        this.isInteracting = false;
        this.currentDialog = null;
        this.currentMenu = null;
        this.currentInteractionPoint = null;
        
        // Remove any existing keyboard listeners
        if (this.spaceKey) {
            this.spaceKey.removeAllListeners();
            this.spaceKey = null;
        }
        if (this.enterKey) {
            this.enterKey.removeAllListeners();
            this.enterKey = null;
        }
        if (this.backspaceKey) {
            this.backspaceKey.removeAllListeners();
            this.backspaceKey = null;
        }
        if (this.escapeKey) {
            this.escapeKey.removeAllListeners();
            this.escapeKey = null;
        }

        if (!this.scene.input?.keyboard) {
            console.warn('[InteractionController] Keyboard not available, will retry initialization later');
            return;
        }

        console.log('[InteractionController] Setting up keyboard input');
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.backspaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.escapeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Adicionar listener para fechar diálogo com espaço
        this.spaceKey.on('down', () => {
            if (this.currentDialog && !this.isEnteringPassword) {
                this.currentDialog.close();
            }
        });

        this.isInitialized = true;
        console.log('[InteractionController] Initialization complete');
    }

    private stopMusic(): void {
        if (this.musicState.currentSong) {
            this.musicState.currentSong.stop();
            this.musicState.currentSong.destroy();
            this.musicState.currentSong = null;
        }
        this.musicState.isPlaying = false;
        this.musicState.currentSongInfo = null;
        
        // Reset device states if they were playing
        if (this.jblState.state === 'playing') {
            this.jblState.state = this.isPaired ? 'paired' : 'bluetooth';
        }
        if (this.computerState.state === 'playing') {
            this.computerState.state = this.isPaired ? 'paired' : 'on';
        }

        this.showDialog('Silêncio. Mas o ruído continua por dentro.', {
            dialogColor: 0x0d1642,
            portrait: 'heric',
            name: 'Você',
            autoClose: true
        });
    }

    private cleanupInteractionState(): void {
        console.log('[InteractionController] Cleaning up interaction state');
        this.menuManager.closeCurrentMenu();
        this.currentInteractionPoint = null;
        this.isInteracting = false;
        this.playerController.setDialogActive(false);
        this.cleanupPasswordInput();
    }

    private showInteractionMenu(point: InteractionPoint): void {
        console.log('[InteractionController] Showing interaction menu for point:', point.type);
        
        // Limpar estado anterior se existir
        this.menuManager.closeCurrentMenu();

        // Se ainda estiver em diálogo, limpar
        if (this.currentDialog) {
            console.log('[InteractionController] Closing existing dialog before showing menu');
            this.currentDialog.close();
            this.cleanupInteractionState();
        }

        // Se for vaso, mostrar diálogo direto
        if (point.type === 'vaso') {
            this.handleLook(point);
            return;
        }

        this.currentInteractionPoint = point;
        this.isInteracting = true;
        this.playerController.setDialogActive(true);

        // Get menu position
        const position = {
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 60
        };

        // Prepare menu data based on point type
        const menuData = {
            point,
            gameState: this.gameState,
            
            // Ações comuns e do Telescópio
            onLook: () => this.handleLook(point),
            onExamine: () => this.handleTelescopeExamine(point),
            onStatus: () => this.handleTelescopeStatus(point),
            
            // Ações da JBL e Computador
            onPick: () => this.handlePick(point),
            onShutdown: () => this.handleShutdown(point),
            onConnect: () => this.handleConnect(point),
            onCancelPairing: () => this.handleCancelPairing(point),
            onKick: () => this.handleKickJBL(point),
            onBite: () => this.handleBiteJBL(point),
            onVolumeControl: () => this.showVolumeControl(),
            onPlayMusic: () => {
                if (!this.isPaired) {
                    this.showDialog('Você precisa parear a JBL com o computador primeiro!', {
                        dialogColor: 0xff0000,
                        autoClose: true
                    });
                    return;
                }
                if (this.musicState.currentSongInfo) {
                    this.handlePlayMusic(this.musicState.currentSongInfo);
                } else {
                    this.showMusicSelection();
                }
            },
            onStopMusic: () => this.stopMusic(),
            
            // Ações específicas do Computador
            onUnlock: () => this.showPasswordPrompt()
        };

        // Show appropriate menu based on point type
        this.menuManager.showMenu(point.type, position, menuData);
    }

    private getComputerStatusText(): string {
        if (!this.computerState.isOn) return 'Desligado';
        if (this.computerState.isHacked) return 'Hackeado';
        if (this.computerState.isUnlocked) return 'Desbloqueado';
        if (this.computerState.state === 'playing') return 'Reproduzindo';
        return 'Bloqueado';
    }

    private handleShutdown(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (point.type === 'computador') {
            this.computerState.isOn = false;
            this.computerState.state = 'off';
            this.stopMusic();
            this.showDialog('O computador foi desligado com segurança.', {
                dialogColor: 0x0d1642,
                autoClose: true
            });
        } else if (point.type === 'jbl') {
            this.jblState.isOn = false;
            this.jblState.isBluetoothEnabled = false;
            this.jblState.state = 'off';
            this.stopMusic();
            this.showDialog('A JBL foi desligada.', {
                dialogColor: 0x0d1642,
                autoClose: true
            });
        }
    }

    private showVolumeControl(): void {
        const options = [
            {
                label: '🔊 Volume Máximo',
                onSelect: () => this.handleVolumeChange(1.0)
            },
            {
                label: '🔉 Volume Médio',
                onSelect: () => this.handleVolumeChange(0.6)
            },
            {
                label: '🔈 Volume Baixo',
                onSelect: () => this.handleVolumeChange(0.3)
            },
            {
                label: '⬅️ Voltar',
                onSelect: () => this.showInteractionMenu(this.currentInteractionPoint!)
            }
        ];

        this.showDialog('Controle de Volume:', {
            dialogColor: 0x0d1642,
            options
        });
    }

    private handleVolumeChange(volume: number): void {
        if (this.currentMusic) {
            (this.currentMusic as any).volume = volume;
            this.showDialog('Sobe, sobe... até o tímpano rasgar.', {
                dialogColor: 0x0d1642,
                portrait: 'heric',
                name: 'Você',
                autoClose: true
            });
        }
    }

    private handleLook(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (point.type === 'vaso') {
            this.showDialog('Um vaso bonito com uma planta exótica. Parece ser uma espécie rara de samambaia que só cresce em Santos.', {
                dialogColor: 0x0d1642,
                portrait: 'player_portrait',
                name: 'Você',
                autoClose: true
            });
            return;
        }

        if (point.type === 'telescopio') {
            // Criar instância do TelescopeView
            const telescopeView = new TelescopeView({
                scene: this.scene,
                imageKey: 'cidade',
                radius: 150,
                panSpeed: 5,
                maxOffset: 200,
                borderColor: 0x000000,
                crosshairColor: 0x000000,
                onClose: () => {
                    this.playerController.setDialogActive(false);
                    this.isInteracting = false;
                    this.showDialog('Você abaixa o telescópio.', {
                        dialogColor: 0x0d1642,
                        portrait: 'player_portrait',
                        name: 'Você',
                        autoClose: true
                    });
                }
            });

            this.showDialog('Você olha através do telescópio e vê o horizonte de Santos. O mar se estende até onde a vista alcança, e os prédios antigos da cidade se misturam com as estruturas futuristas.\n\nUse as setas do teclado para mover a vista.\nPressione [ESC] para sair.', {
                dialogColor: 0x0d1642,
                portrait: 'player_portrait',
                name: 'Você',
                autoClose: true,
                onClose: () => {
                    if (telescopeView.isViewActive()) {
                        telescopeView.destroy();
                    }
                    this.playerController.setDialogActive(false);
                    this.isInteracting = false;
                }
            });
            return;
        }

        if (point.type === 'jbl') {
            const message = ESTADOS_DISPOSITIVOS.jbl[this.jblState.state].look;
            this.showDialog(message, {
                dialogColor: 0x0d1642
            });
            return;
        }

        if (point.type === 'computador') {
            const message = ESTADOS_DISPOSITIVOS.computer[this.computerState.state].look;
            this.showDialog(message, {
                dialogColor: 0x0d1642
            });
            return;
        }

        this.showDialog('Você olha atentamente, mas não vê nada de especial.');
    }

    private handleCheck(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (point.type === 'jbl') {
            const message = ESTADOS_DISPOSITIVOS.jbl[this.jblState.state].check;
            this.showDialog(message);
            return;
        }

        if (point.type === 'computador') {
            const message = ESTADOS_DISPOSITIVOS.computer[this.computerState.state].check;
            this.showDialog(message);
            return;
        }

        this.showDialog('Nada de especial para verificar aqui.');
    }

    private handlePick(point: InteractionPoint): void {
        this.currentMenu?.close();

        if (point.type === 'jbl') {
            if (this.jblState.state === 'off') {
                this.jblState.isOn = true;
                this.jblState.state = 'on';
                this.showAchievement(MENSAGENS_CONQUISTA.jblOn);
            } else if (this.jblState.state === 'on') {
                this.jblState.isBluetoothEnabled = true;
                this.jblState.state = 'bluetooth';
                this.showAchievement(MENSAGENS_CONQUISTA.bluetoothOn);
            }
            
            const message = ESTADOS_DISPOSITIVOS.jbl[this.jblState.state].use;
            this.showDialog(message);
            return;
        }

        if (point.type === 'computador') {
            if (this.computerState.state === 'off') {
                this.computerState.isOn = true;
                this.computerState.state = 'on';
                this.showAchievement(MENSAGENS_CONQUISTA.computerOn);
            }
            
            const message = ESTADOS_DISPOSITIVOS.computer[this.computerState.state].use;
            this.showDialog(message);
            return;
        }

        this.showDialog('Você não consegue interagir com isso.');
    }

    private showPasswordPrompt(): void {
        this.isEnteringPassword = true;
        this.currentPasswordInput = '';
        
        // Setup keyboard input for password
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) return;

        // Add keyboard listener for characters
        keyboard.on('keydown', (event: KeyboardEvent) => {
            if (!this.isEnteringPassword) return;
            
            if (event.key.length === 1) {
                this.currentPasswordInput += event.key;
                this.updatePasswordDialog();
            }
        });

        // Setup enter key for submission
        this.enterKey?.on('down', () => {
            if (this.isEnteringPassword) {
                this.handlePasswordInput(this.currentPasswordInput);
                this.cleanupPasswordInput();
            }
        });

        // Setup backspace for deletion
        this.backspaceKey?.on('down', () => {
            if (this.isEnteringPassword) {
                this.currentPasswordInput = this.currentPasswordInput.slice(0, -1);
                this.updatePasswordDialog();
            }
        });

        // Setup escape to cancel
        this.escapeKey?.on('down', () => {
            if (this.isEnteringPassword) {
                this.cleanupPasswordInput();
                this.showInteractionMenu(this.currentInteractionPoint!);
            }
        });

        this.updatePasswordDialog();
    }

    private updatePasswordDialog(): void {
        const maskedPassword = '*'.repeat(this.currentPasswordInput.length);
        this.showDialog(`Digite a senha para desbloquear o sistema:\n\n${maskedPassword}\n\n[ENTER] Confirmar | [ESC] Cancelar`, {
            dialogColor: 0x0d1642
        });
    }

    private cleanupPasswordInput(): void {
        if (!this.isEnteringPassword) return;
        
        this.isEnteringPassword = false;
        this.currentPasswordInput = '';
        
        // Remove keyboard listeners
        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            keyboard.removeAllListeners('keydown');
        }
    }

    private handlePasswordInput(input: string): void {
        // Always show incorrect password message, regardless of input
        this.showDialog('Senha incorreta. Tente novamente ou... talvez um método mais direto?', {
            dialogColor: 0xff0000
        });
        this.cleanupPasswordInput();
    }

    private handleTalk(point: InteractionPoint): void {
        this.currentMenu?.close();

        if (point.type === 'jbl') {
            const message = ESTADOS_DISPOSITIVOS.jbl[this.jblState.state].talk;
            this.showDialog(message, {
                dialogColor: 0x0d1642,
                portrait: 'jbl',
                name: 'JBL',
                autoClose: true
            });
            return;
        }

        if (point.type === 'computador') {
            const message = ESTADOS_DISPOSITIVOS.computer[this.computerState.state].talk;
            this.showDialog(message, {
                dialogColor: 0x0d1642,
                portrait: 'computer',
                name: 'Computador',
                autoClose: true
            });
            return;
        }

        // Se for NPC, usa o sistema de diálogo do NPCController
        if (point.type === 'npc' && point.data?.npcConfig) {
            const npcController = (this.scene as any).npcController;
            if (npcController) {
                npcController.showDialog(point.data.npcConfig.dialog[0], {
                    portrait: point.data.npcConfig.spriteKey,
                    name: point.data.npcConfig.name,
                    color: 0x0d1642
                });
                return;
            }
        }

        this.showDialog('Não há ninguém para conversar aqui.');
    }

    private handleKickJBL(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (!this.jblState.isOn) {
            this.showDialog('Você chuta a JBL desligada. Nada acontece...', {
                dialogColor: 0x0d1642,
                portrait: 'heric',
                name: 'Você',
                autoClose: true
            });
            return;
        }

        if (this.jblState.isBluetoothEnabled) {
            this.showDialog('Você chuta a JBL. O Bluetooth já está ativado!', {
                dialogColor: 0x0d1642,
                portrait: 'heric',
                name: 'Você',
                autoClose: true
            });
            return;
        }

        // Se chegou aqui, a JBL está ligada mas sem Bluetooth
        this.showDialog(ESTADOS_DISPOSITIVOS.jbl.bluetooth.use, {
            dialogColor: 0x0d1642,
            portrait: 'jbl',
            name: 'JBL',
            autoClose: true,
            onClose: () => {
                this.jblState.isBluetoothEnabled = true;
                if (this.computerState.isOn) {
                    this.isPaired = true;
                    this.showAchievement(MENSAGENS_CONQUISTA.connected);
                }
                if (this.currentInteractionPoint) {
                    this.showInteractionMenu(this.currentInteractionPoint);
                }
            }
        });
    }

    private handleKickComputer(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (this.computerState.isOn && !this.computerState.isKicked) {
            this.computerState.isKicked = true;
            this.showDialog('Você chuta o computador!\n*CRASH*\nEle parece mais receptivo agora.', {
                dialogColor: 0x0d1642,
                portrait: 'computer',
                name: 'Computador',
                autoClose: true
            });
        } else {
            this.showDialog('Melhor não chutar o computador agora...', {
                dialogColor: 0x0d1642,
                portrait: 'heric',
                name: 'Você',
                autoClose: true
            });
        }
    }

    private handleConnect(point: InteractionPoint): void {
        this.currentMenu?.close();

        if (point.type === 'jbl') {
            this.jblState.isPairingMode = true;
            this.showDialog(ESTADOS_DISPOSITIVOS.jbl.pairing.look + '\n' + ESTADOS_DISPOSITIVOS.jbl.pairing.use, {
                dialogColor: 0x0d1642,
                portrait: 'jbl',
                name: 'JBL',
                autoClose: true,
                onClose: () => {
                    if (this.computerState.isOn && this.computerState.isPairingMode) {
                        this.isPaired = true;
                        this.jblState.isPairingMode = false;
                        this.computerState.isPairingMode = false;
                        this.showDialog(ESTADOS_DISPOSITIVOS.jbl.paired.look + '\n' + ESTADOS_DISPOSITIVOS.jbl.paired.use, {
                            dialogColor: 0x0d1642,
                            portrait: 'jbl',
                            name: 'JBL',
                            autoClose: true
                        });
                    }
                }
            });
            return;
        }

        if (point.type === 'computador') {
            this.computerState.isPairingMode = true;
            this.showDialog(ESTADOS_DISPOSITIVOS.computer.pairing.look + '\n' + ESTADOS_DISPOSITIVOS.computer.pairing.use, {
                dialogColor: 0x0d1642,
                portrait: 'computer',
                name: 'Computador',
                autoClose: true,
                onClose: () => {
                    if (this.jblState.isOn && this.jblState.isBluetoothEnabled && this.jblState.isPairingMode) {
                        this.isPaired = true;
                        this.jblState.isPairingMode = false;
                        this.computerState.isPairingMode = false;
                        this.showDialog(ESTADOS_DISPOSITIVOS.computer.paired.look + '\n' + ESTADOS_DISPOSITIVOS.computer.paired.use, {
                            dialogColor: 0x0d1642,
                            portrait: 'computer',
                            name: 'Computador',
                            autoClose: true
                        });
                    }
                }
            });
        }
    }

    private canConnect(): boolean {
        return (
            this.jblState.isOn &&
            this.jblState.isBluetoothEnabled &&
            this.computerState.isOn &&
            this.jblState.isPairingMode &&
            this.computerState.isPairingMode &&
            !this.isPaired
        );
    }

    private getConnectionErrorMessage(): string {
        if (!this.jblState.isOn) return 'A JBL precisa estar ligada.';
        if (!this.jblState.isBluetoothEnabled) return 'A JBL precisa estar com Bluetooth ativado primeiro.';
        if (!this.computerState.isOn) return 'O computador precisa estar ligado.';
        if (!this.jblState.isPairingMode) return 'A JBL precisa estar em modo de pareamento.';
        if (!this.computerState.isPairingMode) return 'O computador precisa estar em modo de pareamento.';
        if (this.isPaired) return 'Os dispositivos já estão pareados.';
        return 'Não é possível conectar os dispositivos no momento.';
    }

    private showMusicSelection(): void {
        if (!this.isPaired) {
            this.showDialog('Você precisa parear a JBL com o computador primeiro!', {
                dialogColor: 0xff0000,
                autoClose: true
            });
            return;
        }

        // Verificar se o teclado está disponível
        if (!this.scene.input?.keyboard) {
            console.warn('[InteractionController] Keyboard not available');
            return;
        }

        // Criar um array com as músicas disponíveis
        const songs = MUSICAS_REVOLUCIONARIAS;
        let selectedIndex = 0;

        // Criar o texto de seleção inicial
        const message = 'Escolha uma música para tocar:\n\n' +
            songs.map((song, index) => 
                `${index === selectedIndex ? '> ' : '  '}${song.title} - ${song.artist}`
            ).join('\n') +
            '\n\n[↑/↓] Navegar   [ENTER] Selecionar   [ESC] Sair';

        // Configurar as teclas
        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            this.upKey = keyboard.addKey('UP');
            this.downKey = keyboard.addKey('DOWN');
            this.enterKey = keyboard.addKey('ENTER');
            this.escKey = keyboard.addKey('ESC');

            // Adicionar event listeners
            this.upKey?.on('down', () => {
                selectedIndex = (selectedIndex - 1 + songs.length) % songs.length;
                updateSelection();
            });

            this.downKey?.on('down', () => {
                selectedIndex = (selectedIndex + 1) % songs.length;
                updateSelection();
            });

            this.enterKey?.on('down', () => {
                const selectedSong = songs[selectedIndex];
                if (selectedSong) {
                    this.handlePlayMusic(selectedSong);
                    this.cleanupMusicSelection();
                }
            });

            this.escKey?.on('down', () => {
                if (this.currentDialog) {
                    this.currentDialog.close();
                    this.cleanupMusicSelection();
                }
            });
        }

        // Função para atualizar a seleção
        const updateSelection = () => {
            const newMessage = 'Escolha uma música para tocar:\n\n' +
                songs.map((song, index) => 
                    `${index === selectedIndex ? '> ' : '  '}${song.title} - ${song.artist}`
                ).join('\n') +
                '\n\n[↑/↓] Navegar   [ENTER] Selecionar   [ESC] Sair';

            if (this.currentDialog) {
                this.currentDialog.updateText(newMessage);
            }
        };

        // Mostrar o diálogo inicial
        this.showDialog(message, {
            dialogColor: 0x0d1642,
            onClose: () => {
                this.cleanupMusicSelection();
            }
        });
    }

    private cleanupMusicSelection(): void {
        // Limpar os event listeners
        this.upKey?.destroy();
        this.downKey?.destroy();
        this.enterKey?.destroy();
        this.escKey?.destroy();
        this.upKey = null;
        this.downKey = null;
        this.enterKey = null;
        this.escKey = null;
    }

    private handlePlayMusic(song: SongInfo): void {
        if (!this.isPaired) {
            this.showDialog('Você precisa parear a JBL com o computador primeiro!', {
                dialogColor: 0xff0000,
                autoClose: true
            });
            return;
        }

        if (!this.jblState.isOn || !this.computerState.isOn) {
            this.showDialog('Tanto a JBL quanto o computador precisam estar ligados!', {
                dialogColor: 0xff0000,
                autoClose: true
            });
            return;
        }

        // Stop any existing music first
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
        }
        
        // Create new music instance
        this.currentMusic = this.scene.sound.add('lesbica_futurista', { 
            loop: true,
            volume: this.jblState.volume 
        });
        
        this.currentMusic.play();
        this.musicState.isPlaying = true;
        this.musicState.currentSongInfo = song;
        
        // Update device states
        this.jblState.state = 'playing';
        this.computerState.state = 'playing';
        
        // Show achievement and message
        this.showAchievement(MENSAGENS_CONQUISTA.musicPlaying);
        
        this.showDialog('Hora da batida techno lésbica.\n\n' + 
                       `🎧 Tocando agora: ${song.title} por ${song.artist}\n${song.description}`, {
            dialogColor: 0x0d1642,
            portrait: 'jbl',
            name: 'JBL',
            autoClose: true,
            noMenuReturn: true,
            onClose: () => {
                const npcController = (this.scene as any).npcController;
                if (npcController) {
                    npcController.wakeUpAngry();
                }
            }
        });
    }

    private showAchievement(message: string): void {
        // Criar um texto flutuante com a mensagem de conquista
        const screenWidth = this.scene.cameras.main.width;
        const achievementText = this.scene.add.text(screenWidth / 2, 100, message, {
            fontSize: '20px',
            color: '#ff1493',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        });
        achievementText.setOrigin(0.5);
        achievementText.setScrollFactor(0);
        achievementText.setDepth(1000);

        // Animar o texto
        this.scene.tweens.add({
            targets: achievementText,
            y: 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                achievementText.destroy();
            }
        });
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
            onClose?: () => void;
        } = {}
    ): void {
        console.log('[InteractionController] Showing dialog:', message);
        
        // Se houver um menu ativo, fechamos ele
        if (this.currentMenu) {
            console.log('[InteractionController] Closing current menu before showing dialog');
            this.currentMenu.close();
            this.currentMenu = null;
        }

        // Se houver um diálogo ativo, fechamos ele
        if (this.currentDialog) {
            console.log('[InteractionController] Closing current dialog');
            this.currentDialog.close();
            this.currentDialog = null;
        }

        // Se a mensagem estiver vazia, apenas limpamos os diálogos
        if (!message) {
            console.log('[InteractionController] Empty message, just cleaning up');
            this.cleanupInteractionState();
            return;
        }

        this.isInteracting = true;
        this.playerController.setDialogActive(true);

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
            dialogColor: options.dialogColor || 0x0d1642,
            options: options.options,
            autoClose: options.autoClose,
            noMenuReturn: options.noMenuReturn,
            onClose: () => {
                console.log('[InteractionController] Dialog closed');
                
                if (options.onClose) {
                    options.onClose();
                }

                // Só reabrimos o menu se:
                // 1. Não for autoClose
                // 2. Não for noMenuReturn
                // 3. Tivermos um ponto de interação
                // 4. Não estivermos no processo de sair
                if (!options.autoClose && 
                    !options.noMenuReturn && 
                    this.currentInteractionPoint) {
                    console.log('[InteractionController] Reopening menu after dialog');
                    this.showInteractionMenu(this.currentInteractionPoint);
                } else {
                    console.log('[InteractionController] Not reopening menu - cleaning up state');
                    this.cleanupInteractionState();
                }
            }
        });

        if (this.currentDialog) {
            this.scene.children.bringToTop(this.currentDialog as any);
        }
    }

    public checkInteractions(playerSprite: Phaser.GameObjects.Sprite, playerClearance: string): void {
        if (!this.isInitialized) {
            console.log('[InteractionController] Not initialized, reinitializing...');
            this.init();
            return;
        }

        if (this.isInteracting || !this.spaceKey?.isDown) return;

        console.log('[InteractionController] Checking interactions...');
        const playerBounds = playerSprite.getBounds();

        for (const point of this.interactionPoints) {
            const distance = Phaser.Math.Distance.Between(
                playerBounds.centerX,
                playerBounds.centerY,
                point.x,
                point.y
            );

            if (distance <= (point.radius || this.interactionDistance)) {
                console.log('[InteractionController] Found interaction point in range:', point.type);
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

    private handleKickNPC(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (point.data?.npcConfig) {
            this.showDialog(`Você considera chutar ${point.data.npcConfig.name}, mas desiste.\nAfinal, ele é seu amigo...`, {
                dialogColor: 0x0d1642,
                portrait: 'heric',
                name: 'Você',
                autoClose: true
            });
        }
    }

    private handleHitNPC(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (point.data?.npcConfig) {
            this.showDialog(`Você não vai bater no ${point.data.npcConfig.name}.\nEle é seu amigo, afinal de contas.`, {
                dialogColor: 0x0d1642,
                portrait: 'heric',
                name: 'Você',
                autoClose: true
            });
        }
    }

    /**
     * Verifica se todas as condições estão prontas para tocar música automaticamente.
     * Retorna true se:
     * - Computador está hackeado.
     * - JBL está ligada.
     * - Bluetooth está ativado.
     * - Pareamento já ocorreu (isPaired === true).
     */
    private shouldAutoPlayMusic(): boolean {
        return (
            this.computerState.isHacked &&
            this.jblState.isOn &&
            this.jblState.isBluetoothEnabled &&
            this.isPaired
        );
    }

    private tryAutoPlayMusicAfterHack(): void {
        if (this.shouldAutoPlayMusic()) {
            this.showMusicSelection();
        }
    }

    private handleBiteJBL(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        this.showDialog('Eu não vou botar a boca nessa merda.', {
            dialogColor: 0x0d1642,
            portrait: 'heric',
            name: 'Você',
            autoClose: true
        });
    }

    private handleCancelPairing(point: InteractionPoint): void {
        this.currentMenu?.close();
        
        if (point.type === 'jbl') {
            this.jblState.isPairingMode = false;
            this.jblState.state = 'bluetooth';
            this.showDialog('Modo de pareamento da JBL cancelado.', {
                dialogColor: 0x0d1642,
                autoClose: true
            });
        } else if (point.type === 'computador') {
            this.computerState.isPairingMode = false;
            this.computerState.state = 'on';
            this.showDialog('Modo de pareamento do computador cancelado.', {
                dialogColor: 0x0d1642,
                autoClose: true
            });
        }
    }

    private handleTelescopeExamine(point: InteractionPoint): void {
        this.showDialog('Você examina o telescópio mais detalhadamente. É um modelo antigo, mas bem conservado. As lentes estão limpas e o mecanismo de ajuste funciona perfeitamente.', {
            dialogColor: 0x0d1642,
            portrait: 'player_portrait',
            name: 'Você',
            autoClose: true
        });
    }

    private handleTelescopeStatus(point: InteractionPoint): void {
        this.showDialog('Status do Telescópio:\n- Lentes: Limpas\n- Mecanismo: Funcional\n- Ajuste: Preciso\n- Última Manutenção: Recente', {
            dialogColor: 0x0d1642,
            portrait: 'player_portrait',
            name: 'Você',
            autoClose: true
        });
    }
} 