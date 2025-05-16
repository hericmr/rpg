import { Scene } from 'phaser';
import { MenuRegistry, MenuOption } from './MenuRegistry';
import { InteractionMenu } from '../InteractionMenu';

export interface MenuPosition {
    x: number;
    y: number;
}

export class MenuManager {
    private static instance: MenuManager;
    private currentMenu: InteractionMenu | null = null;
    private scene: Scene | null = null;
    private registry: MenuRegistry;
    private onMenuClosed?: () => void;

    private constructor() {
        this.registry = MenuRegistry.getInstance();
    }

    public static getInstance(): MenuManager {
        if (!MenuManager.instance) {
            MenuManager.instance = new MenuManager();
        }
        return MenuManager.instance;
    }

    public setScene(scene: Scene): void {
        this.scene = scene;
    }

    public setOnMenuClosed(callback: () => void): void {
        this.onMenuClosed = callback;
    }

    public showMenu(type: string, position: MenuPosition, data?: any): void {
        if (!this.scene) {
            console.error('[MenuManager] No scene set');
            return;
        }

        // Close any existing menu
        this.closeCurrentMenu();

        const config = this.registry.getMenuConfig(type);
        if (!config) {
            console.error(`[MenuManager] No menu config found for type: ${type}`);
            return;
        }

        const options = this.registry.getAllOptions(type, data);
        if (options.length === 0) {
            console.warn(`[MenuManager] No options available for menu type: ${type}`);
            return;
        }

        this.currentMenu = new InteractionMenu({
            scene: this.scene,
            x: position.x,
            y: position.y,
            options,
            title: config.title,
            onClose: () => {
                if (config.onClose) config.onClose();
                this.currentMenu = null;
                if (this.onMenuClosed) this.onMenuClosed();
            }
        });
    }

    public closeCurrentMenu(): void {
        if (this.currentMenu) {
            this.currentMenu.close();
            this.currentMenu = null;
            if (this.onMenuClosed) this.onMenuClosed();
        }
    }

    public isMenuActive(): boolean {
        return this.currentMenu !== null && this.currentMenu.isMenuActive();
    }
} 