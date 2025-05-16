import { Scene, GameObjects } from 'phaser';

interface DialogBoxOption {
  label: string;
  onSelect: () => void;
}

export interface DialogBoxConfig {
  scene: Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  dialog: string;
  portrait?: string;
  portraitScale?: number;
  name?: string;
  dialogColor?: number;
  textColor?: string;
  onClose?: () => void;
  options?: DialogBoxOption[];
  autoClose?: boolean;
  noMenuReturn?: boolean;
}

export class DialogBox extends Phaser.GameObjects.Container {
  public scene: Scene;
  private outerBorder: GameObjects.Rectangle;
  private innerBorder: GameObjects.Rectangle;
  private background: GameObjects.Rectangle;
  private text: GameObjects.Text;
  private portrait?: GameObjects.Image;
  private nameText?: GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;
  private isActive: boolean = false;
  private optionButtons: GameObjects.Text[] = [];
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private dialog: string;
  private onClose?: () => void;

  constructor(config: DialogBoxConfig) {
    super(config.scene, config.x, config.y);

    this.scene = config.scene;
    this.isActive = true;
    this.dialog = config.dialog;
    this.onClose = config.onClose;

    // Definir cores padrão
    const dialogColor = config.dialogColor || 0x0d1642;
    const textColor = config.textColor || '#FFFFFF';

    // Ajustar posição Y para ficar na parte inferior
    const bottomOffset = 20; // Espaço entre a caixa e a borda inferior
    const adjustedY = this.scene.cameras.main.height - (config.height / 2) - bottomOffset;

    // Criar borda externa (branca)
    this.outerBorder = this.scene.add.rectangle(
      config.x,
      adjustedY,
      config.width,
      config.height,
      0xFFFFFF
    );
    this.outerBorder.setScrollFactor(0);
    this.outerBorder.setDepth(199);

    // Criar borda interna (preta)
    this.innerBorder = this.scene.add.rectangle(
      config.x,
      adjustedY,
      config.width - 4,
      config.height - 4,
      0x000000
    );
    this.innerBorder.setScrollFactor(0);
    this.innerBorder.setDepth(200);

    // Criar fundo colorido
    this.background = this.scene.add.rectangle(
      config.x,
      adjustedY,
      config.width - 8,
      config.height - 8,
      dialogColor
    );
    this.background.setScrollFactor(0);
    this.background.setDepth(201);

    // Adicionar retrato se fornecido
    if (config.portrait) {
      this.portrait = this.scene.add.image(
        config.x - (config.width / 2) + 40,
        adjustedY,
        config.portrait
      );
      this.portrait.setScale(config.portraitScale || 2);
      this.portrait.setScrollFactor(0);
      this.portrait.setDepth(202);
    }

    // Criar texto do nome
    if (config.name) {
      this.nameText = this.scene.add.text(
        config.x + (config.width / 2) - 20,
        adjustedY - (config.height / 2) + 20,
        config.name,
        {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: textColor,
          align: 'right'
        }
      );
      this.nameText.setScrollFactor(0);
      this.nameText.setDepth(202);
      this.nameText.setOrigin(1, 0);  // Alinha à direita
    }

    // Criar texto do diálogo
    this.text = this.scene.add.text(
      config.x + (config.width / 2) - 20,
      adjustedY - 10,
      config.dialog,
      {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: textColor,
        wordWrap: { width: config.width - (this.portrait ? 100 : 40) },
        align: 'right'
      }
    );
    this.text.setOrigin(1, 0.5);
    this.text.setScrollFactor(0);
    this.text.setDepth(202);

    // Se houver opções, criar botões
    if (config.options && config.options.length > 0) {
      const baseX = config.x + (config.width / 2) - 20;
      const baseY = adjustedY + 20;
      const spacing = 110;
      config.options.forEach((option, idx) => {
        const btn = this.scene.add.text(
          baseX - idx * spacing,
          baseY,
          option.label,
          {
            fontSize: '10px',
            color: '#FFFFFF',
            backgroundColor: '#222',
            padding: { x: 10, y: 5 },
            align: 'right'
          }
        ).setInteractive({ useHandCursor: true })
         .on('pointerdown', () => {
            option.onSelect();
            this.close();
         });
        btn.setScrollFactor(0);
        btn.setDepth(203);
        btn.setOrigin(1, 0);
        this.optionButtons.push(btn);
      });
    }

    // Se autoClose for true, fecha automaticamente após 4 segundos
    if (config.autoClose) {
      this.scene.time.delayedCall(6000, () => {
        if (this.isActive) {
          this.destroy();
        }
      });
    }
    // Se não houver opções e não for autoClose, usa o comportamento padrão de 10 segundos
    else if (!config.options || config.options.length === 0) {
      // Configurar timer de 10 segundos
      this.timer = this.scene.time.delayedCall(10000, () => {
        if (this.isActive) {
          this.destroy();
        }
      });

      // Configurar tecla de espaço
      this.spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.spaceKey?.on('down', () => {
        if (this.timer) this.timer.destroy();
        this.destroy();
      });
    }

    // Adiciona indicador de espaço para fechar
    const closeText = this.scene.add.text(0, config.height - 20, '[ESPAÇO] Fechar', {
      fontSize: '14px',
      color: '#ffffff',
      align: 'right'
    });
    closeText.setOrigin(1, 1);
    closeText.setPosition(config.width - 10, config.height - 5);
    this.add(closeText);
  }

  public updateText(newText: string): void {
    if (!this.isActive) return;
    
    this.dialog = newText;
    this.text.setText(newText);
  }

  public close(): void {
    if (!this.isActive) return;
    
    this.background.destroy();
    this.text.destroy();
    this.innerBorder.destroy();
    this.outerBorder.destroy();
    if (this.nameText) this.nameText.destroy();
    if (this.portrait) this.portrait.destroy();
    this.optionButtons.forEach(btn => btn.destroy());
    
    this.isActive = false;
    if (this.timer) this.timer.destroy();
  }

  public isDialogActive(): boolean {
    return this.isActive;
  }

  destroy(): void {
    // Remover o listener da tecla de espaço
    this.spaceKey?.removeAllListeners();
    this.spaceKey?.destroy();
    
    // Destruir todos os elementos gráficos
    this.outerBorder.destroy();
    this.innerBorder.destroy();
    this.background.destroy();
    this.text.destroy();
    this.portrait?.destroy();
    this.nameText?.destroy();
    this.timer?.destroy();
    
    // Destruir botões de opções
    this.optionButtons.forEach(button => button.destroy());
    this.optionButtons = [];
    
    this.isActive = false;
    
    if (this.onClose) {
      this.onClose();
    }
  }
} 