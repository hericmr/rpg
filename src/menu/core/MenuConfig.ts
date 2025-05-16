import { MenuOption } from './MenuOption';

export interface MenuConfig {
    type: string;
    title?: string;
    baseOptions: MenuOption[];
    onClose?: () => void;
} 