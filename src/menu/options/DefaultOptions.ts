import { MenuOption } from '../core/MenuOption';
import GameState from '../../state/GameState';

export function createDefaultOptions(gameState: GameState): MenuOption[] {
    return [
        {
            icon: '👁️',
            label: 'Olhar',
            order: 1,
            onSelect: () => {},
        },
        {
            icon: '👄',
            label: 'Morder',
            order: 2,
            onSelect: () => {},
        },
        {
            icon: '👢',
            label: 'Chutar',
            order: 3,
            onSelect: () => {},
            condition: () => true
        }
    ];
} 