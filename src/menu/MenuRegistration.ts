import { MenuRegistry } from './core/MenuRegistry';
import GameState from '../state/GameState';
import { createJBLMenu } from './handlers/JBLMenuHandler';
import { createComputerMenu } from './handlers/ComputerMenuHandler';
import { createNPCMenu } from './handlers/NPCMenuHandler';
import { createThoughtMenu } from './handlers/ThoughtMenuHandler';

export function registerAllMenus(gameState: GameState): void {
    const registry = MenuRegistry.getInstance();
    
    // Registrar cada menu usando seus respectivos handlers
    registry.registerMenu(createJBLMenu(gameState));
    registry.registerMenu(createComputerMenu(gameState));
    registry.registerMenu(createNPCMenu(gameState));
    registry.registerMenu(createThoughtMenu(gameState));
} 