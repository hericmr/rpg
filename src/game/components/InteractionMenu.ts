import { Scene, GameObjects } from 'phaser';

interface InteractionMenuOption {
    icon: string;
    label: string;
    onSelect: () => void;
}

interface InteractionMenuConfig {
    scene: Scene;
    x: number;
    y: number;
    options: InteractionMenuOption[];
    onClose?: () => void;
    title?: string; // título do objeto
}

export class InteractionMenu {
    private scene: Scene;
    private background: GameObjects.Rectangle;
    private buttons: GameObjects.Text[];
    private isActive: boolean = false;
    private selectedIndex: number = 0;
    private options: InteractionMenuOption[];
    private keyLeft: Phaser.Input.Keyboard.Key;
    private keyRight: Phaser.Input.Keyboard.Key;
    private keyEnter: Phaser.Input.Keyboard.Key;
    private keySpace: Phaser.Input.Keyboard.Key;
    private keyEsc: Phaser.Input.Keyboard.Key;
    private border: GameObjects.Rectangle;
    private onClose?: () => void;
    private titleText?: GameObjects.Text;
    private escText?: GameObjects.Text;

    constructor(config: InteractionMenuConfig) {
        this.scene = config.scene;
        this.isActive = true;
        this.buttons = [];
        this.options = config.options;
        this.onClose = config.onClose;

        // Bind methods to ensure correct 'this' context
        this.close = this.close.bind(this);
        this.moveLeft = this.moveLeft.bind(this);
        this.moveRight = this.moveRight.bind(this);
        this.selectOption = this.selectOption.bind(this);

        // Criar fundo do menu
        this.background = this.scene.add.rectangle(
            config.x,
            config.y,
            300,
            100,
            0x1a237e // Azul igual ao DialogBox
        );
        this.background.setAlpha(0.99);
        this.background.setScrollFactor(0);
        this.background.setDepth(100);

        // Criar borda
        this.border = this.scene.add.rectangle(
            config.x,
            config.y,
            204,
            104,
            0xFFFFFF // Borda branca igual ao DialogBox
        );
        this.border.setScrollFactor(0);
        this.border.setDepth(99);

        // Exibir título se fornecido
        if (config.title) {
            this.titleText = this.scene.add.text(
                config.x,
                config.y - 40, // Acima do menu
                config.title,
                {
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    color: '#FFD700',
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5);
            this.titleText.setScrollFactor(0);
            this.titleText.setDepth(103);
        }

        // Adicionar texto do ESC
        this.escText = this.scene.add.text(
            config.x,
            config.y + 35, // Abaixo dos botões
            '[ESC para sair]',
            {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#FFD700',
                align: 'center'
            }
        ).setOrigin(0.5, 0.5);
        this.escText.setScrollFactor(0);
        this.escText.setDepth(103);

        // Criar botões
        const spacing = 50;
        const startX = config.x - ((config.options.length - 1) * spacing) / 2;
        
        config.options.forEach((option, index) => {
            const button = this.scene.add.text(
                startX + (index * spacing),
                config.y,
                option.icon,
                {
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    color: '#FFFFFF',
                    align: 'center',
                    backgroundColor: undefined
                }
            );
            button.setScrollFactor(0);
            button.setDepth(101);
            button.setOrigin(0.5, 0.5);
            this.buttons.push(button);
        });

        this.updateSelection();

        // Teclas para navegação
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) {
            throw new Error('Keyboard input not available');
        }
        this.keyLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.keyEnter = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEsc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.keyLeft.on('down', this.moveLeft, this);
        this.keyRight.on('down', this.moveRight, this);
        this.keyEnter.on('down', this.selectOption, this);
        this.keySpace.on('down', this.selectOption, this);
        this.keyEsc.on('down', this.close, this);
    }

    private moveLeft() {
        if (!this.isActive) return;
        this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        this.updateSelection();
    }

    private moveRight() {
        if (!this.isActive) return;
        this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        this.updateSelection();
    }

    private selectOption() {
        if (!this.isActive) return;
        // Apenas executa o callback, sem lógica especial
        this.options[this.selectedIndex].onSelect();
    }

    private updateSelection() {
        this.buttons.forEach((btn, idx) => {
            if (idx === this.selectedIndex) {
                btn.setStyle({ backgroundColor: '#FFD700', color: '#1a237e' });
                // Mostrar o label abaixo do ícone
                btn.setText(`${this.options[idx].icon}\n${this.options[idx].label}`);
                btn.setFontSize(16);
            } else {
                btn.setStyle({ backgroundColor: undefined, color: '#FFFFFF' });
                // Mostrar apenas o ícone
                btn.setText(this.options[idx].icon);
                btn.setFontSize(24);
            }
        });
    }

    public close(): void {
        console.log('[InteractionMenu] Starting close() method - isActive:', this.isActive);
        if (!this.isActive) {
            console.log('[InteractionMenu] Menu already inactive, skipping close');
            return;
        }
        
        try {
            this.isActive = false;
            console.log('[InteractionMenu] Menu deactivated');
            
            console.log('[InteractionMenu] Destroying background');
            if (this.background) {
                this.background.destroy();
            }
            
            console.log('[InteractionMenu] Destroying buttons');
            this.buttons.forEach((btn, index) => {
                console.log(`[InteractionMenu] Destroying button ${index}`);
                if (btn) {
                    btn.destroy();
                }
            });
            this.buttons = [];
            
            console.log('[InteractionMenu] Destroying border');
            if (this.border) {
                this.border.destroy();
            }
            
            console.log('[InteractionMenu] Destroying title text');
            if (this.titleText) {
                this.titleText.destroy();
            }

            // Destruir texto do ESC
            if (this.escText) {
                this.escText.destroy();
            }
            
            console.log('[InteractionMenu] Removing keyboard listeners');
            if (this.keyLeft) {
                this.keyLeft.off('down', this.moveLeft, this);
            }
            if (this.keyRight) {
                this.keyRight.off('down', this.moveRight, this);
            }
            if (this.keyEnter) {
                this.keyEnter.off('down', this.selectOption, this);
            }
            if (this.keySpace) {
                this.keySpace.off('down', this.selectOption, this);
            }
            if (this.keyEsc) {
                this.keyEsc.off('down', this.close, this);
            }
            
            if (this.onClose) {
                console.log('[InteractionMenu] Calling onClose callback');
                this.onClose();
            }
        } catch (error) {
            console.error('[InteractionMenu] Error during close:', error);
        }
    }

    public isMenuActive(): boolean {
        return this.isActive;
    }
} 