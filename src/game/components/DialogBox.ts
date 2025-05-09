import { Scene, GameObjects } from 'phaser';

interface DialogBoxOption {
  label: string;
  onSelect: () => void;
}

interface DialogBoxConfig {
  scene: Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  dialog: string;
  portrait?: string;
  name?: string;
  dialogColor?: number;
  textColor?: string;
  onClose?: () => void;
  options?: DialogBoxOption[];
}

export class DialogBox {
  private scene: Scene;
  private background: GameObjects.Rectangle;
  private text: GameObjects.Text;
  private nameText?: GameObjects.Text;
  private portrait?: GameObjects.Image;
  private outerBorder: GameObjects.Rectangle;
  private innerBorder: GameObjects.Rectangle;
  private timer?: Phaser.Time.TimerEvent;
  private isActive: boolean = false;
  private optionButtons: GameObjects.Text[] = [];

  constructor(config: DialogBoxConfig) {
    this.scene = config.scene;
    this.isActive = true;

    // Definir cores padrão
    const dialogColor = config.dialogColor || 0x1a237e;
    const textColor = config.textColor || '#FFFFFF';

    // Criar borda externa (branca)
    this.outerBorder = this.scene.add.rectangle(
      config.x,
      config.y,
      config.width,
      config.height,
      0xFFFFFF
    );
    this.outerBorder.setScrollFactor(0);
    this.outerBorder.setDepth(1);

    // Criar borda interna (preta)
    this.innerBorder = this.scene.add.rectangle(
      config.x,
      config.y,
      config.width - 4,
      config.height - 4,
      0x000000
    );
    this.innerBorder.setScrollFactor(0);
    this.innerBorder.setDepth(1);

    // Criar fundo colorido
    this.background = this.scene.add.rectangle(
      config.x,
      config.y,
      config.width - 8,
      config.height - 8,
      dialogColor
    );
    this.background.setScrollFactor(0);
    this.background.setDepth(1);
    // Adicionar retrato se fornecido
    if (config.portrait) {
      this.portrait = this.scene.add.image(
        config.x - (config.width / 2) + 40,
        config.y - 10,
        config.portrait
      );
      this.portrait.setScale(0.8);
      this.portrait.setScrollFactor(0);
      this.portrait.setDepth(2);
    }

    // Criar texto do nome
    if (config.name) {
      this.nameText = this.scene.add.text(
        config.x - (config.width / 2) + (this.portrait ? 80 : 20),
        config.y - (config.height / 2) + 20,
        config.name,
        {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: textColor
        }
      );
      this.nameText.setScrollFactor(0);
      this.nameText.setDepth(2);
    }

    // Criar texto do diálogo
    this.text = this.scene.add.text(
      config.x - (config.width / 2) + (this.portrait ? 80 : 20),
      config.y,
      config.dialog,
      {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: textColor,
        wordWrap: { width: config.width - (this.portrait ? 100 : 40) }
      }
    );
    this.text.setScrollFactor(0);
    this.text.setDepth(2);

    // Se houver opções, criar botões
    if (config.options && config.options.length > 0) {
      const baseX = config.x - (config.width / 2) + (this.portrait ? 80 : 20);
      const baseY = config.y + 40;
      const spacing = 110;
      config.options.forEach((option, idx) => {
        const btn = this.scene.add.text(
          baseX + idx * spacing,
          baseY,
          option.label,
          {
            fontSize: '10px',
            color: '#FFD700',
            backgroundColor: '#222',
            padding: { x: 10, y: 5 }
          }
        ).setInteractive({ useHandCursor: true })
         .on('pointerdown', () => {
            option.onSelect();
            this.close();
         });
        btn.setScrollFactor(0);
        btn.setDepth(3);
        this.optionButtons.push(btn);
      });
    }

    // Só ativa timer e espaço se não houver opções
    if (!config.options || config.options.length === 0) {
      // Configurar timer de 6 segundos
      this.timer = this.scene.time.delayedCall(6000, () => {
        this.close();
      });

      // Configurar tecla de espaço
      const spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey?.on('down', () => {
        if (this.timer) this.timer.destroy();
        this.close();
      });
    }
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
} 