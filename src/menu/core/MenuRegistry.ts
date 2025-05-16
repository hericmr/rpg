import { MenuConfig } from './MenuConfig';

export class MenuRegistry {
    private static instance: MenuRegistry;
    private menus: Map<string, MenuConfig>;

    private constructor() {
        this.menus = new Map();
    }

    public static getInstance(): MenuRegistry {
        if (!MenuRegistry.instance) {
            MenuRegistry.instance = new MenuRegistry();
        }
        return MenuRegistry.instance;
    }

    public registerMenu(config: MenuConfig): void {
        this.menus.set(config.type, config);
    }

    public getMenu(type: string): MenuConfig | undefined {
        return this.menus.get(type);
    }

    public getAllMenus(): Map<string, MenuConfig> {
        return this.menus;
    }
} 