import { MenuConfig } from '../core/MenuConfig';
import { MenuOption } from '../core/MenuOption';
import GameState from '../../state/GameState';
import { createDefaultOptions } from '../options/DefaultOptions';

export function createNPCMenu(gameState: GameState): MenuConfig {
    const defaultOptions = createDefaultOptions(gameState);
    
    const npcSpecificOptions: MenuOption[] = [
        {
            icon: '🗣️',
            label: 'Conversar',
            order: 4,
            onSelect: () => {},
        },
        {
            icon: '❓',
            label: 'Status',
            order: 5,
            onSelect: () => {},
        },
        {
            icon: '🎵',
            label: 'Tocar Música',
            order: 6,
            condition: () => (
                gameState.isPaired &&
                !gameState.musicState.isPlaying
            ),
            onSelect: () => {},
        },
        {
            icon: '😈',
            label: 'Provocar',
            order: 7,
            condition: () => gameState.musicState.isPlaying,
            onSelect: () => {},
        }
    ];

    return {
        type: 'npc',
        baseOptions: [...defaultOptions, ...npcSpecificOptions],
        onClose: () => {
            console.log('[Menu] NPC menu closed');
        }
    };
} 