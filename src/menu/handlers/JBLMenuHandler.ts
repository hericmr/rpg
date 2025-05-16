import { MenuConfig } from '../core/MenuConfig';
import { MenuOption } from '../core/MenuOption';
import GameState from '../../state/GameState';
import { ESTADOS_DISPOSITIVOS } from '../../config/estadosTransitorios';
import { createDefaultOptions } from '../options/DefaultOptions';

export function createJBLMenu(gameState: GameState): MenuConfig {
    const defaultOptions = createDefaultOptions(gameState);
    
    const jblSpecificOptions: MenuOption[] = [
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
    ];

    return {
        type: 'jbl',
        title: '🎵 JBL',
        baseOptions: [...defaultOptions, ...jblSpecificOptions],
        onClose: () => {
            console.log('[Menu] JBL menu closed');
        }
    };
} 