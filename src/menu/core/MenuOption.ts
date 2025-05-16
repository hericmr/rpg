export interface MenuOption {
    icon: string;
    label: string;
    order: number;
    onSelect: () => void;
    condition?: () => boolean;
} 