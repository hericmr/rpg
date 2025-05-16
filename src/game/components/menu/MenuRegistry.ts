import { Scene } from 'phaser';

export interface MenuOption {
    icon: string;
    label: string;
    onSelect: () => void;
    condition?: () => boolean;
    order?: number;
}

export interface MenuConfig {
    type: string;
    title?: string;
    baseOptions: MenuOption[];
    onClose?: () => void;
}

export class MenuRegistry {
    private static instance: MenuRegistry;
    private menuConfigs: Map<string, MenuConfig> = new Map();

    private constructor() {}

    public static getInstance(): MenuRegistry {
        if (!MenuRegistry.instance) {
            MenuRegistry.instance = new MenuRegistry();
        }
        return MenuRegistry.instance;
    }

    public registerMenu(config: MenuConfig): void {
        this.menuConfigs.set(config.type, config);
    }

    public getMenuConfig(type: string, data?: any): MenuConfig | undefined {
        const config = this.menuConfigs.get(type);
        if (!config) return undefined;

        // Se for menu de NPC, define o título com o nome do NPC
        if (type === 'npc' && data?.npcConfig?.name) {
            return {
                ...config,
                title: `👤 ${data.npcConfig.name}`
            };
        }

        return config;
    }

    public getAllOptions(type: string, data: any): MenuOption[] {
        const config = this.menuConfigs.get(type);
        if (!config) return [];

        // Process base options with the provided data
        return config.baseOptions
            .map(option => {
                const processedOption = { ...option };
                
                // Map onSelect functions based on the data provided
                switch (option.label) {
                    // Ações comuns
                    case 'Olhar':
                        processedOption.onSelect = data.onLook;
                        break;

                    // Ações da JBL e Computador
                    case 'Ligar':
                        processedOption.onSelect = data.onPick;
                        break;
                    case 'Desligar':
                        processedOption.onSelect = data.onShutdown;
                        break;
                    case 'Morder':
                        processedOption.onSelect = data.onBite;
                        break;
                    case 'Parear':
                    case 'Ativar Pareamento':
                        processedOption.onSelect = data.onConnect;
                        break;
                    case 'Cancelar Pareamento':
                        processedOption.onSelect = data.onCancelPairing;
                        break;
                    case 'Chutar':
                        if (type === 'jbl') {
                            processedOption.onSelect = data.onKick;
                        } else if (type === 'computador') {
                            processedOption.onSelect = data.onHack;
                        } else {
                            processedOption.onSelect = data.onKick;
                        }
                        break;
                    case 'Bater':
                        processedOption.onSelect = data.onHitNPC;
                        break;
                    case 'Volume':
                        processedOption.onSelect = data.onVolumeControl;
                        break;
                    case 'Tocar Música':
                        processedOption.onSelect = data.onPlayMusic;
                        break;
                    case 'Parar Música':
                        processedOption.onSelect = data.onStopMusic;
                        break;

                    // Ações específicas do Computador
                    case 'Desbloquear':
                        processedOption.onSelect = data.onUnlock;
                        break;
                    case 'Hackear':
                        processedOption.onSelect = data.onHack;
                        break;
                    case 'Arquivos':
                        processedOption.onSelect = data.onFiles;
                        break;
                    case 'Conectar JBL':
                        processedOption.onSelect = data.onConnect;
                        break;

                    // Ações de NPC
                    case 'Conversar':
                        processedOption.onSelect = data.onTalk;
                        break;
                    case 'Status':
                        processedOption.onSelect = data.onStatus;
                        break;
                    case 'Provocar':
                        processedOption.onSelect = data.onProvoke;
                        break;
                }

                // Ensure we have a valid onSelect function
                if (!processedOption.onSelect) {
                    console.warn(`[MenuRegistry] No handler found for action: ${option.label}`);
                    return null;
                }

                return processedOption;
            })
            .filter((option): option is MenuOption => {
                if (!option) return false;
                
                // Se não houver condição, sempre mostra a opção
                if (!option.condition) return true;
                
                // Se houver condição, avalia com base no gameState fornecido
                return option.condition();
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
} 