import { Scene } from 'phaser';
import { DialogBox } from '../components/DialogBox';
import { InteractionMenu } from '../components/InteractionMenu';
import { ESTADOS_DISPOSITIVOS, MUSICAS_REVOLUCIONARIAS, MENSAGENS_CONQUISTA, SongInfo } from '../config/estadosTransitorios';
import GameState, { JBLDeviceState, ComputerDeviceState, MusicState } from '../state/GameState';
import { PlayerController } from './PlayerController';

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
    private playerController: PlayerController | null = null;
    private currentPasswordInput: string = '';
    private isEnteringPassword: boolean = false;
    private upKey: Phaser.Input.Keyboard.Key | null = null;
    private downKey: Phaser.Input.Keyboard.Key | null = null;
    private escKey: Phaser.Input.Keyboard.Key | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
        this.gameState = GameState.getInstance();
    }

    public setPlayerController(playerController: PlayerController): void {
        this.playerController = playerController;
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

        this.isInitialized = true;
        console.log('[InteractionController] Initialization complete');
    }

    private stopMusic(): void {
        // Stop ALL existing sounds/music first
        if (this.scene.sound) {
            this.scene.sound.getAllPlaying().forEach(sound => {
                sound.stop();
                sound.destroy();
            });
        }

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
            this.computerState.state = this.computerState.isHacked ? 'hacked' : (this.isPaired ? 'paired' : 'unlocked');
        }
    }

    private cleanupInteractionState(): void {
        this.isInteracting = false;
        this.currentMenu = null;
        this.currentInteractionPoint = null;
        this.playerController?.setDialogActive(false);
        this.cleanupPasswordInput();
    }

    private showInteractionMenu(point: InteractionPoint): void {
        console.log('[InteractionController] Attempting to show menu for point:', point.type);
        
        // Limpar estado anterior se existir
        if (this.currentMenu) {
            console.log('[InteractionController] Closing existing menu before showing new one');
            this.currentMenu.close();
            this.cleanupInteractionState();
        }

        // Se ainda estiver em diálogo, limpar
        if (this.currentDialog) {
            console.log('[InteractionController] Closing existing dialog before showing menu');
            this.currentDialog.close();
            this.cleanupInteractionState();
        }

        this.currentInteractionPoint = point;
        this.isInteracting = true;
        this.playerController?.setDialogActive(true);

        const options = [
            {
                icon: '👁️',
                label: 'Olhar',
                onSelect: () => this.handleLook(point)
            }
        ];

        if (point.type === 'computador') {
            // Opções do computador
            if (!this.computerState.isOn) {
                options.push({
                    icon: '⚡',
                    label: 'Ligar',
                    onSelect: () => this.handlePick(point)
                });
            } else {
                if (!this.computerState.isUnlocked && !this.computerState.isHacked) {
                    options.push({
                        icon: '🔑',
                        label: 'Login',
                        onSelect: () => this.showPasswordPrompt()
                    });
                } else if (this.computerState.isHacked) {
                    // Se o computador está hackeado, mostra opções de música e pareamento
                    if (this.jblState.isOn && this.jblState.isBluetoothEnabled && !this.isPaired) {
                        options.push({
                            icon: '🔗',
                            label: 'Parear com JBL',
                            onSelect: () => {
                                this.handleConnect(point);
                            }
                        });
                    }
                    
                    if (this.isPaired) {
                        options.push({
                            icon: '🎵',
                            label: 'Tocar Lésbica Futurista na JBL',
                            onSelect: () => {
                                if (!this.jblState.isOn || !this.jblState.isBluetoothEnabled) {
                                    this.showDialog('A JBL precisa estar ligada e com Bluetooth ativado primeiro!', {
                                        dialogColor: 0xff0000,
                                        autoClose: true
                                    });
                                    return;
                                }
                                
                                // Toca a música
                                if (MUSICAS_REVOLUCIONARIAS.length > 0) {
                                    this.handlePlayMusic(MUSICAS_REVOLUCIONARIAS[0]);
                                }
                            }
                        });
                    }

                    options.push({
                        icon: '🔌',
                        label: 'Desligar',
                        onSelect: () => this.handleShutdown(point)
                    });
                }
            }

            // Adiciona opção de chutar para o computador (sempre disponível)
            options.push({
                icon: '👢',
                label: 'Chutar',
                onSelect: () => this.handleKick(point)
            });

        } else if (point.type === 'jbl') {
            // Opções da JBL Overclocked
            if (!this.jblState.isOn) {
                options.push({
                    icon: '⚡',
                    label: 'Ligar',
                    onSelect: () => this.handlePick(point)
                });
            } else {
                if (this.jblState.state === 'playing') {
                    options.push({
                        icon: '🔊',
                        label: 'Ajustar Volume',
                        onSelect: () => this.showVolumeControl()
                    });
                }

                options.push({
                    icon: '🔌',
                    label: 'Desligar',
                    onSelect: () => this.handleShutdown(point)
                });
            }

            // Adiciona opção de chutar para a JBL
            options.push({
                icon: '👢',
                label: 'Chutar',
                onSelect: () => this.handleKickJBL(point)
            });
        }

        // Opções comuns
        options.push({
            icon: '👄',
            label: 'Falar',
            onSelect: () => this.handleTalk(point)
        });

        let title = '';
        switch (point.type) {
            case 'jbl':
                title = 'Overclocked JBL';
                break;
            case 'computador':
                title = `POPos Terminal - ${this.getComputerStatusText()}`;
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
                console.log('[InteractionController] Menu onClose callback triggered');
                this.cleanupInteractionState();
            }
        });
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

    private showComputerFiles(): void {
        const options = [
            {
                label: '📁 sapphic_beats_collection/',
                onSelect: () => this.showMusicSelection()
            },
            {
                label: '📝 manifesto_lesbico.txt',
                onSelect: () => this.showDialog('Um manifesto poético sobre a revolução lésbica digital.', {
                    dialogColor: 0x0d1642
                })
            },
            {
                label: '🌈 fotos_pride.zip',
                onSelect: () => this.showDialog('Uma coleção de fotos de paradas do orgulho LGBTQIA+.', {
                    dialogColor: 0x0d1642
                })
            },
            {
                label: '⬅️ Voltar',
                onSelect: () => this.showInteractionMenu(this.currentInteractionPoint!)
            }
        ];

        this.showDialog('Arquivos do Sistema:', {
            dialogColor: 0x0d1642,
            options
        });
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
            this.showDialog(`Volume ajustado para ${Math.round(volume * 100)}%`, {
                dialogColor: 0x0d1642,
                autoClose: true
            });
        }
    }

    private handleLook(point: InteractionPoint): void {
        this.currentMenu?.close();
        
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
                this.showPasswordPrompt();
            } else if (this.computerState.state === 'on' && !this.computerState.isUnlocked) {
                this.showPasswordPrompt();
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
                dialogColor: 0x0d1642
            });
            return;
        }

        if (point.type === 'computador') {
            const message = ESTADOS_DISPOSITIVOS.computer[this.computerState.state].talk;
            this.showDialog(message, {
                dialogColor: 0x0d1642
            });
            return;
        }

        this.showDialog('Não há ninguém para conversar aqui.');
    }

    private handleKick(point: InteractionPoint): void {
        this.currentMenu?.close();

        if (point.type === 'computador') {
            if (!this.computerState.isOn) {
                this.showDialog('eu não vou chutar isso...', {
                    dialogColor: 0xff0000,
                    autoClose: true
                });
                return;
            }

            if (!this.computerState.isHacked) {
                this.computerState.isHacked = true;
                this.computerState.isUnlocked = true;
                this.computerState.state = 'hacked';
                
                // Mostra mensagem de hack com tema cyberpunk
                this.showDialog(ESTADOS_DISPOSITIVOS.computer.hacked.look, {
                    dialogColor: 0xff1493,
                    autoClose: true
                });
                this.showAchievement(MENSAGENS_CONQUISTA.computerHacked);
                
                // Show follow-up message about next steps
                this.showDialog(ESTADOS_DISPOSITIVOS.computer.hacked.use, {
                    dialogColor: 0x9400d3,
                    autoClose: true
                });
                return;
            }

            // Se já estiver hackeado, apenas mostra mensagem
            this.showDialog('Não, eu nao preciso chutar isso agora...', {
                dialogColor: 0xff0000,
                autoClose: true
            });
        }
    }

    private handleConnect(point: InteractionPoint): void {
        this.currentMenu?.close();

        if (!this.canConnect()) {
            const errorMessage = this.getConnectionErrorMessage();
            this.showDialog(errorMessage, {
                dialogColor: 0xff0000
            });
            return;
        }
        
        this.isPaired = true;
        this.jblState.state = 'paired';
        // Preserve the hacked state when pairing
        const wasHacked = this.computerState.isHacked;
        this.computerState.state = 'paired';
        this.computerState.isHacked = wasHacked;
        this.showAchievement(MENSAGENS_CONQUISTA.connected);
        
        this.showDialog(ESTADOS_DISPOSITIVOS.jbl.paired.look, {
            dialogColor: 0x9400d3,
            autoClose: true
        });

        // Try to autoplay music after a short delay if computer was hacked
        if (wasHacked) {
            this.scene.time.delayedCall(2100, () => {
                this.tryAutoPlayMusicAfterHack();
            });
        }
    }

    private canConnect(): boolean {
        return (
            this.jblState.isBluetoothEnabled &&
            this.computerState.isOn &&
            (this.computerState.isHacked || this.computerState.isUnlocked)
        );
    }

    private getConnectionErrorMessage(): string {
        if (!this.jblState.isBluetoothEnabled) return 'A JBL precisa estar com Bluetooth ativado primeiro.';
        if (!this.computerState.isOn) return 'O computador precisa estar ligado.';
        if (!this.computerState.isUnlocked && !this.computerState.isHacked) return 'O computador precisa estar desbloqueado ou hackeado primeiro.';
        return 'Não é possível conectar os dispositivos no momento.';
    }

    private showMusicSelection(): void {
        if (!this.computerState.isUnlocked && !this.computerState.isHacked) {
            this.showDialog('Você precisa ter acesso ao sistema para escolher músicas.', {
                dialogColor: 0xff0000
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

        // Configurar as teclas antes de mostrar o diálogo
        const keyboard = this.scene.input.keyboard;
        this.upKey = keyboard.addKey('UP');
        this.downKey = keyboard.addKey('DOWN');
        this.enterKey = keyboard.addKey('ENTER');
        this.escKey = keyboard.addKey('ESC');

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

        // Adicionar event listeners
        if (this.upKey && this.downKey && this.enterKey && this.escKey) {
            this.upKey.on('down', () => {
                selectedIndex = (selectedIndex - 1 + songs.length) % songs.length;
                updateSelection();
            });

            this.downKey.on('down', () => {
                selectedIndex = (selectedIndex + 1) % songs.length;
                updateSelection();
            });

            this.enterKey.on('down', () => {
                const selectedSong = songs[selectedIndex];
                if (selectedSong) {
                    this.handlePlayMusic(selectedSong);
                }
            });

            this.escKey.on('down', () => {
                if (this.currentDialog) {
                    this.currentDialog.close();
                }
            });
        }

        // Mostrar o diálogo inicial
        this.showDialog(message, {
            dialogColor: 0x0d1642,
            onClose: () => {
                // Limpar os event listeners quando o diálogo for fechado
                if (this.upKey) {
                    this.upKey.destroy();
                    this.upKey = null;
                }
                if (this.downKey) {
                    this.downKey.destroy();
                    this.downKey = null;
                }
                if (this.enterKey) {
                    this.enterKey.destroy();
                    this.enterKey = null;
                }
                if (this.escKey) {
                    this.escKey.destroy();
                    this.escKey = null;
                }
            }
        });
    }

    private handlePlayMusic(song: SongInfo): void {
        this.currentMenu?.close();

        // Verificar se a música já está tocando
        if (this.musicState.isPlaying) {
            this.showDialog('A música já está tocando!', {
                dialogColor: 0xff0000,
                autoClose: true
            });
            return;
        }

        // Verificar todas as condições necessárias
        if (!this.canPlayMusic()) {
            const errorMessage = this.getMusicErrorMessage();
            this.showDialog(errorMessage, {
                dialogColor: 0xff0000,
                autoClose: true
            });
            return;
        }

        // Stop ALL existing sounds/music first
        if (this.scene.sound) {
            this.scene.sound.getAllPlaying().forEach(sound => {
                sound.stop();
                sound.destroy();
            });
        }

        // Stop previous music if any
        this.stopMusic();
        
        // Update states
        this.jblState.state = 'playing';
        this.computerState.state = 'playing';
        this.musicState.isPlaying = true;
        this.musicState.currentSongInfo = song;
        
        // Play the new music
        this.musicState.currentSong = this.scene.sound.add('lesbica_futurista', {
            volume: this.jblState.volume,
            loop: true
        });
        this.musicState.currentSong.play();

        // Show achievement and current song info with cyberpunk theme
        this.showAchievement(MENSAGENS_CONQUISTA.musicPlaying);
        
        // Mostra mensagem temática de música tocando
        this.showDialog(ESTADOS_DISPOSITIVOS.jbl.playing.look + "\n\n" + 
                       `🎧 Tocando agora: ${song.title} por ${song.artist}\n${song.description}`, {
            dialogColor: 0x0d1642,
            autoClose: true,
            noMenuReturn: true,
            onClose: () => {
                // Trigger NPC wake up reaction after dialog closes
                const npcController = (this.scene as any).npcController;
                if (npcController) {
                    npcController.wakeUpAngry();
                    // Mostrar mensagem do NPC acordando
                    this.scene.time.delayedCall(500, () => {
                        this.showDialog('💢 O QUE É ISSO?! que barulho é esse!!!! QUEM OUSA PERTURBAR MEU SONO?!', {
                            dialogColor: 0x0d1642,
                            autoClose: true
                        });
                    });
                }
            }
        });
    }

    private canPlayMusic(): boolean {
        return (
            this.jblState.isOn &&
            this.jblState.isBluetoothEnabled &&
            this.computerState.isOn &&
            (this.computerState.isUnlocked || this.computerState.isHacked) &&
            (this.isPaired || this.jblState.state === 'paired' || this.computerState.state === 'paired') &&
            !this.musicState.isPlaying
        );
    }

    private getMusicErrorMessage(): string {
        if (this.musicState.isPlaying) return 'A música já está tocando!';
        if (!this.jblState.isOn) return 'A JBL precisa estar ligada.';
        if (!this.jblState.isBluetoothEnabled) return 'O Bluetooth da JBL precisa estar ativado.';
        if (!this.computerState.isOn) return 'O computador precisa estar ligado.';
        if (!this.computerState.isUnlocked && !this.computerState.isHacked) return 'O computador precisa estar desbloqueado ou hackeado.';
        if (!this.isPaired && this.jblState.state !== 'paired' && this.computerState.state !== 'paired') return 'A JBL precisa estar pareada com o computador.';
        return 'Não é possível tocar música no momento.';
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
        this.playerController?.setDialogActive(true);

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

    private handleKickJBL(point: InteractionPoint): void {
        this.currentMenu?.close();

        if (point.type === 'jbl') {
            if (!this.jblState.isOn) {
                this.showDialog('eu não vou chutar isso...', {
                    dialogColor: 0xff0000,
                    autoClose: true
                });
                return;
            }

            if (!this.jblState.isBluetoothEnabled) {
                this.jblState.isBluetoothEnabled = true;
                this.jblState.state = 'bluetooth';
                
                // Mostra mensagem de ativação do Bluetooth com tema cyberpunk
                this.showDialog(ESTADOS_DISPOSITIVOS.jbl.bluetooth.look, {
                    dialogColor: 0xff1493,
                    autoClose: true
                });
                this.showAchievement(MENSAGENS_CONQUISTA.bluetoothOn);
                
                // Show follow-up message about pairing
                this.showDialog(ESTADOS_DISPOSITIVOS.jbl.bluetooth.use, {
                    dialogColor: 0x9400d3,
                    autoClose: true
                });
                return;
            }

            this.showDialog('Não, eu nao preciso chutar isso agora...', {
                dialogColor: 0xff0000,
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
} 