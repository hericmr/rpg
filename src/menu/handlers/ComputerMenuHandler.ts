import { MenuConfig } from '../core/MenuConfig';
import { MenuOption } from '../core/MenuOption';
import GameState from '../../state/GameState';
import { ESTADOS_DISPOSITIVOS } from '../../config/estadosTransitorios';
import { createDefaultOptions } from '../options/DefaultOptions';

export function createComputerMenu(gameState: GameState): MenuConfig {
    const defaultOptions = createDefaultOptions(gameState);
    
    const computerSpecificOptions: MenuOption[] = [
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
    ];

    return {
        type: 'computador',
        title: '💻 Computador',
        baseOptions: [...defaultOptions, ...computerSpecificOptions],
        onClose: () => {
            console.log('[Menu] Computador menu closed');
        }
    };
} 