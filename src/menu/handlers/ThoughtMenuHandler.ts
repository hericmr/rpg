import { MenuConfig } from '../core/MenuConfig';
import GameState from '../../state/GameState';
import { createDefaultOptions } from '../options/DefaultOptions';

export function createThoughtMenu(gameState: GameState): MenuConfig {
    const defaultOptions = createDefaultOptions(gameState);
    
    return {
        type: 'thought',
        title: '💭 Pensamento',
        baseOptions: [...defaultOptions],
        onClose: () => {
            console.log('[Menu] Thought menu closed');
        }
    };
} 