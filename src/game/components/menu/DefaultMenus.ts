import { MenuRegistry, MenuOption } from './MenuRegistry';
import GameState from '../../state/GameState';
import { ESTADOS_DISPOSITIVOS } from '../../config/estadosTransitorios';

// Função para criar as opções padrão
function createDefaultOptions(gameState: GameState): MenuOption[] {
    return [
        {
            icon: '👁️',
            label: 'Olhar',
            order: 1,
            onSelect: () => {},
            portrait: 'hericrostoolhar'
        },
        {
            icon: '👄',
            label: 'Morder',
            order: 2,
            onSelect: () => {},
            portrait: 'hericrosto_morder'
        },
        {
            icon: '👢',
            label: 'Chutar',
            order: 3,
            onSelect: () => {},
            condition: () => true // Será sobrescrito para JBL no MenuRegistry
        }
    ];
}

export function registerDefaultMenus(gameState: GameState): void {
    const registry = MenuRegistry.getInstance();
    const defaultOptions = createDefaultOptions(gameState);

    // Menu da JBL
    registry.registerMenu({
        type: 'jbl',
        title: '🎵 JBL',
        baseOptions: [
            ...defaultOptions,
            {
                icon: '✋',
                label: 'Ligar',
                order: 4,
                condition: () => !gameState.jblState.isOn,
                onSelect: () => {
                    gameState.jblState.isOn = true;
                    gameState.jblState.state = 'on';
                    console.log('[JBL] ' + ESTADOS_DISPOSITIVOS.jbl.on.use);
                },
            },
            {
                icon: '🔌',
                label: 'Desligar',
                order: 5,
                condition: () => gameState.jblState.isOn,
                onSelect: () => {
                    gameState.jblState.isOn = false;
                    gameState.jblState.state = 'off';
                    gameState.jblState.isBluetoothEnabled = false;
                    gameState.isPaired = false;
                    console.log('[JBL] ' + ESTADOS_DISPOSITIVOS.jbl.off.use);
                },
            },
            {
                icon: '📱',
                label: 'Bluetooth',
                order: 6,
                condition: () => (
                    gameState.jblState.isOn &&
                    !gameState.jblState.isBluetoothEnabled
                ),
                onSelect: () => {
                    gameState.jblState.isBluetoothEnabled = true;
                    gameState.jblState.state = 'bluetooth';
                    console.log('[JBL] ' + ESTADOS_DISPOSITIVOS.jbl.bluetooth.use);
                },
            },
            {
                icon: '👢',
                label: 'Chutar',
                order: 7,
                condition: () => (
                    gameState.jblState.isOn && 
                    !gameState.jblState.isBluetoothEnabled
                ),
                onSelect: () => {},
            },
            {
                icon: '🔗',
                label: 'Ativar Pareamento',
                order: 8,
                condition: () => (
                    gameState.jblState.isOn &&
                    gameState.jblState.isBluetoothEnabled &&
                    !gameState.isPaired &&
                    !gameState.jblState.isPairingMode
                ),
                onSelect: () => {
                    gameState.jblState.isPairingMode = true;
                    console.log('[JBL] ' + ESTADOS_DISPOSITIVOS.jbl.pairing.use);
                    
                    // Se o computador estiver ligado e com Bluetooth, conecta automaticamente
                    if (gameState.computerState.isOn && gameState.computerState.isPairingMode) {
                        gameState.isPaired = true;
                        gameState.jblState.isPairingMode = false;
                        gameState.computerState.isPairingMode = false;
                        console.log('[JBL] ' + ESTADOS_DISPOSITIVOS.jbl.paired.use);
                    }
                },
            },
            {
                icon: '❌',
                label: 'Cancelar Pareamento',
                order: 9,
                condition: () => gameState.jblState.isPairingMode,
                onSelect: () => {
                    gameState.jblState.isPairingMode = false;
                    console.log('[JBL] ' + ESTADOS_DISPOSITIVOS.jbl.bluetooth.use);
                },
            }
        ],
        onClose: () => {
            console.log('[Menu] JBL menu closed');
        }
    });

    // Menu do Computador
    registry.registerMenu({
        type: 'computador',
        title: '💻 Computador',
        baseOptions: [
            ...defaultOptions,
            {
                icon: '✋',
                label: 'Ligar',
                order: 4,
                condition: () => !gameState.computerState.isOn,
                onSelect: () => {
                    gameState.computerState.isOn = true;
                    gameState.computerState.state = 'on';
                    console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.on.use);
                },
            },
            {
                icon: '🔌',
                label: 'Desligar',
                order: 5,
                condition: () => gameState.computerState.isOn,
                onSelect: () => {
                    gameState.computerState.isOn = false;
                    gameState.computerState.state = 'off';
                    gameState.isPaired = false;
                    if (gameState.musicState.isPlaying) {
                        gameState.musicState.isPlaying = false;
                        gameState.jblState.state = 'bluetooth';
                    }
                    console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.off.use);
                },
            },
            {
                icon: '🔗',
                label: 'Ativar Pareamento',
                order: 6,
                condition: () => (
                    gameState.computerState.isOn &&
                    !gameState.isPaired &&
                    !gameState.computerState.isPairingMode
                ),
                onSelect: () => {
                    gameState.computerState.isPairingMode = true;
                    console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.pairing.use);
                    
                    // Se a JBL estiver ligada e com Bluetooth, conecta automaticamente
                    if (gameState.jblState.isOn && gameState.jblState.isBluetoothEnabled && gameState.jblState.isPairingMode) {
                        gameState.isPaired = true;
                        gameState.jblState.isPairingMode = false;
                        gameState.computerState.isPairingMode = false;
                        console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.paired.use);
                    }
                },
            },
            {
                icon: '❌',
                label: 'Cancelar Pareamento',
                order: 7,
                condition: () => gameState.computerState.isPairingMode,
                onSelect: () => {
                    gameState.computerState.isPairingMode = false;
                    console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.on.use);
                },
            },
            {
                icon: '▶️',
                label: 'Tocar Música',
                order: 8,
                condition: () => (
                    gameState.computerState.isOn &&
                    gameState.isPaired &&
                    !gameState.musicState.isPlaying
                ),
                onSelect: () => {
                    gameState.musicState.isPlaying = true;
                    gameState.jblState.state = 'playing';
                    gameState.computerState.state = 'playing';
                    console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.playing.use);
                },
            },
            {
                icon: '⏹️',
                label: 'Parar Música',
                order: 9,
                condition: () => gameState.musicState.isPlaying,
                onSelect: () => {
                    gameState.musicState.isPlaying = false;
                    gameState.jblState.state = 'paired';
                    gameState.computerState.state = 'paired';
                    console.log('[Computador] ' + ESTADOS_DISPOSITIVOS.computer.paired.use);
                },
            }
        ],
        onClose: () => {
            console.log('[Menu] Computador menu closed');
        }
    });

    // Menu de NPC
    registry.registerMenu({
        type: 'npc',
        baseOptions: [
            ...defaultOptions,
            {
                icon: '🗣️',
                label: 'Conversar',
                order: 4,
                onSelect: () => {},
            },
            // Ações específicas de NPC
            {
                icon: '❓',
                label: 'Status',
                order: 5,
                onSelect: () => {},
            },
            {
                icon: '🤜',
                label: 'Bater',
                order: 6,
                onSelect: () => {},
            },
            {
                icon: '🎵',
                label: 'Tocar Música',
                order: 7,
                condition: () => (
                    gameState.isPaired &&
                    !gameState.musicState.isPlaying
                ),
                onSelect: () => {},
            },
            {
                icon: '😈',
                label: 'Provocar',
                order: 8,
                condition: () => gameState.musicState.isPlaying,
                onSelect: () => {},
            }
        ],
        onClose: () => {
            console.log('[Menu] NPC menu closed');
        }
    });

    // Menu de Pensamento (para pontos de interação genéricos)
    registry.registerMenu({
        type: 'thought',
        title: '💭 Pensamento',
        baseOptions: [
            ...defaultOptions
        ],
        onClose: () => {
            console.log('[Menu] Thought menu closed');
        }
    });

    // Menu do Telescópio
    registry.registerMenu({
        type: 'telescopio',
        title: '🔭 Telescópio',
        baseOptions: [
            {
                icon: '👁️',
                label: 'Olhar',
                order: 1,
                onSelect: () => {},
            },
            {
                icon: '🔍',
                label: 'Examinar',
                order: 2,
                onSelect: () => {},
            },
            {
                icon: '📝',
                label: 'Status',
                order: 3,
                onSelect: () => {},
            }
        ],
        onClose: () => {
            console.log('[Menu] Telescope menu closed');
        }
    });
} 