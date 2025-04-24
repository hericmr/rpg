// Escritório Corporativo da Corporação Caiçara - Torre Principal (Andar 87)
// SantosPunk 2099

import { Scene, GameObjects, Physics, Input, Types } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { GBC_COLORS } from '../config/colors';
import { CorporateOffice, SANTOSPUNK_CORPORATE_OFFICE, renderOfficeState } from '../config/office';

// Interfaces para melhor tipagem
interface MapLayers {
  wallsLayer: GameObjects.Container;
  floorLayer: GameObjects.Container;
  objectsLayer: GameObjects.Container;
}

interface NPC {
  sprite: GameObjects.Sprite;
  dialog: string[];
  currentDialogIndex: number;
  dialogBox?: {
    background: GameObjects.Rectangle;
    text: GameObjects.Text;
    border: GameObjects.Rectangle;
    innerBorder: GameObjects.Rectangle;
    outerBorder: GameObjects.Rectangle;
    faceImage: GameObjects.Image;
    nameText: GameObjects.Text;
    timer?: Phaser.Time.TimerEvent;
  };
}

interface Player {
  sprite: Physics.Arcade.Sprite;
  inventory: string[];
  stats: {
    clearance: string;
    implants: string[];
  };
}

interface NPCData {
    id: string;
    name: string;
    position: {x: number, y: number};
    implants: string[];
    clearance: string;
    dialog: string[];
}

export default class GameScene extends Scene {
  private office: CorporateOffice;
  private player!: Player;
  private npcs: Map<string, NPC>;
  private mapLayers: MapLayers | null;
  private cursors: {
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
  } = {};
  private dialogActive: boolean;
  private closeDialogKey!: Input.Keyboard.Key;
  private gbEffect!: GBEffect;
  private currentTimeOfDay: string;
  private securityLevel: string;

  constructor() {
    super({ key: 'GameScene', active: true });
    this.office = renderOfficeState(SANTOSPUNK_CORPORATE_OFFICE, "manhã");
    this.dialogActive = false;
    this.currentTimeOfDay = "manhã";
    this.securityLevel = this.office.META_DATA.securityLevel;
    this.npcs = new Map();
    this.mapLayers = null;
  }

  preload(): void {
    this.setupAssetLoading();
    this.loadGameAssets();
  }

  private setupAssetLoading(): void {
    this.load.on('filecomplete', (key: string) => {
      console.log(`Asset carregado: ${key}`);
    });
    
    this.load.on('loaderror', (fileObj: Types.Loader.FileConfig) => {
      console.error(`Erro ao carregar asset: ${fileObj.key}`);
    });
  }
    
  private loadGameAssets(): void {
    // Carregar sprites do jogador e NPCs
    this.load.spritesheet('player', '/assets/heric2.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('lion', '/assets/lion.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.image('lion2', '/assets/lion2.png');
    
    // Carregar assets do mapa
    this.load.image('wall', '/assets/wall.svg');
    this.load.image('floor', '/assets/floor.svg');
    this.load.image('desk', '/assets/desk.svg');
    this.load.image('chair', '/assets/chair.svg');
    this.load.image('terminal', '/assets/terminal.svg');
    this.load.image('elevator', '/assets/elevator.svg');
  }

  create(): void {
    this.initializeGameSystems();
    this.setupGameWorld();
    this.setupPlayer();
    this.setupNPCs();
    this.setupInput();
  }

  private initializeGameSystems(): void {
    // Add Game Boy Color pipeline
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    renderer.pipelines.add('GBEffect', new GBPipeline(this.game));
    
    // Initialize Game Boy Color effect
    this.gbEffect = new GBEffect(this);
  }

  private setupGameWorld(): void {
    this.mapLayers = this.createOfficeMap();
    if (!this.mapLayers) {
      throw new Error('Failed to create map layers');
    }
  }

  private setupPlayer(): void {
    this.createPlayer();
  }
    
  private setupNPCs(): void {
    this.createNPCs();
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    
      this.cursors = this.input.keyboard.createCursorKeys();
    this.closeDialogKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.ESC);
    
    this.closeDialogKey.on('down', () => {
      if (this.dialogActive) {
        this.closeAllDialogs();
      }
    });
  }

  update(): void {
    if (!this.cursors || !this.player) return;

    const speed = 160;
    const player = this.player;

    if (this.cursors.left?.isDown) {
      player.sprite.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      player.sprite.setVelocityX(speed);
    } else {
      player.sprite.setVelocityX(0);
    }

    if (this.cursors.up?.isDown) {
      player.sprite.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      player.sprite.setVelocityY(speed);
    } else {
      player.sprite.setVelocityY(0);
    }
    
    this.updateNPCs();
    this.checkInteractions();
  }

  private checkInteractions(): void {
    if (!this.input.keyboard) return;
    
    const spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    if (this.input.keyboard.checkDown(spaceKey)) {
      this.checkNPCInteractions();
      this.checkObjectInteractions();
    }
  }

  private checkNPCInteractions(): void {
    const playerBounds = this.player.sprite.getBounds();
    
    this.npcs.forEach((npc, id) => {
      const npcBounds = npc.sprite.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, npcBounds)) {
        this.showDialog(npc);
      }
    });
  }

  private checkObjectInteractions(): void {
    // Implementar interação com objetos do escritório
  }

  private createOfficeMap(): MapLayers | null {
    try {
      const floorLayer = this.add.container();
      const wallsLayer = this.add.container();
      const objectsLayer = this.add.container();

      const tileSize = 16;
      const map = this.office.OFFICE_LAYOUT;

      // Criar um grupo de física para as paredes
      const wallGroup = this.physics.add.staticGroup();

      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          const tile = map[y][x];
          const tileX = x * tileSize;
          const tileY = y * tileSize;

          switch (tile) {
            case 'W':
              // Criar retângulo físico para a parede
              const wall = this.add.rectangle(tileX + tileSize/2, tileY + tileSize/2, tileSize, tileSize, 0x000000);
              wallsLayer.add(wall);
              // Adicionar o retângulo ao grupo de física
              wallGroup.add(wall);
              break;
            case 'F':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              break;
            case 'D':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              objectsLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'desk'));
              break;
            case 'C':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              objectsLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'chair'));
              break;
            case 'T':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              objectsLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'terminal'));
              break;
            case 'E':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              objectsLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'elevator'));
              break;
          }
        }
      }

      // Adicionar colisão entre o player e as paredes
      if (this.player) {
        this.physics.add.collider(this.player.sprite, wallGroup);
      }

      // Adicionar colisão entre NPCs e paredes
      this.npcs.forEach(npc => {
        if (npc.sprite.body) {
          this.physics.add.collider(npc.sprite, wallGroup);
        }
      });

      return { wallsLayer, floorLayer, objectsLayer };
    } catch (error) {
      console.error('Error creating office map:', error);
      return null;
    }
  }

  private createPlayer(): void {
    const startX = 2 * 16;
    const startY = 2 * 16;

    const playerSprite = this.physics.add.sprite(startX + 8, startY + 8, 'player');
    
    // Ajustar o tamanho do corpo de colisão do jogador
    playerSprite.setSize(14, 14); // Ligeiramente menor que o tile
    playerSprite.setOffset(1, 1); // Centralizar a colisão
    
    this.player = {
      sprite: playerSprite,
      inventory: [],
      stats: {
        clearance: "Branco",
        implants: []
      }
    };

    // Configurar a câmera para seguir o player
    this.cameras.main.startFollow(playerSprite);
    this.cameras.main.setBounds(0, 0, this.office.OFFICE_LAYOUT[0].length * 16, this.office.OFFICE_LAYOUT.length * 16);
  }

  private createNPCs(): void {
    this.office.OFFICE_NPCS.forEach((npcData: NPCData) => {
      const npcSprite = this.add.sprite(
        npcData.position.x * 16,
        npcData.position.y * 16,
        npcData.id === 'exec_1' ? 'lion' : 'player'
      );

      this.physics.add.existing(npcSprite);
      
      // Tornar o NPC imóvel durante colisões
      if (npcSprite.body) {
        (npcSprite.body as Physics.Arcade.Body).setImmovable(true);
      }
      
      if (this.mapLayers) {
        this.physics.add.collider(npcSprite, this.mapLayers.wallsLayer);
      }

      // Adicionar colisão entre o jogador e o NPC
      if (this.player) {
        this.physics.add.collider(this.player.sprite, npcSprite);
      }

      this.npcs.set(npcData.id, {
        sprite: npcSprite,
        dialog: npcData.dialog,
        currentDialogIndex: 0
      });
    });
  }

  private updateNPCs(): void {
    // Implementar comportamento dos NPCs
    this.npcs.forEach(npc => {
      // Lógica de movimento e comportamento dos NPCs
    });
  }

  private showDialog(npc: NPC): void {
    if (this.dialogActive) return;

    this.dialogActive = true;
    const dialogText = npc.dialog[npc.currentDialogIndex];

    // Ajustar tamanho proporcional à tela do jogo
    const screenWidth = Number(this.game.config.width);
    const screenHeight = Number(this.game.config.height);
    
    const dialogWidth = screenWidth * 0.98;
    const dialogHeight = screenHeight * 0.3;
    const padding = 12;

    const x = screenWidth / 2;
    const y = screenHeight - (dialogHeight / 2) - padding;

    // Criar borda externa (branca)
    const outerBorder = this.add.rectangle(x, y, dialogWidth, dialogHeight, 0xFFFFFF);
    
    // Criar borda interna (preta)
    const innerBorder = this.add.rectangle(x, y, dialogWidth - 4, dialogHeight - 4, 0x000000);
    
    // Criar fundo branco para o texto
    const background = this.add.rectangle(x, y, dialogWidth - 8, dialogHeight - 8, 0xFFFFFF);

    // Criar a imagem do rosto no canto esquerdo
    const faceImage = this.add.image(x - dialogWidth/2 + padding * 2, y - dialogHeight/4, 'lion2');
    faceImage.setScale(0.1);
    
    // Adicionar o nome do NPC abaixo da imagem
    const nameText = this.add.text(x - dialogWidth/2 + padding * 2, y - dialogHeight/2.3 + padding * 4, 'Dr. Lion', {
            fontFamily: 'monospace',
            fontSize: '8px',
      color: '#000000',
      align: 'center'
    });
    nameText.setOrigin(0.5, 0); // Centralizar o texto abaixo da imagem
    
    // Criar o texto do diálogo
    const text = this.add.text(x - dialogWidth/2 + padding * 4, y - dialogHeight/4, dialogText, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#000000',
      align: 'left',
      lineSpacing: 4,
      fixedWidth: dialogWidth - (padding * 1),
      wordWrap: { width: dialogWidth - (padding * 1), useAdvancedWrap: true }
    });

    // Armazenar referências para poder fechar o diálogo depois
          npc.dialogBox = {
      background, 
      text, 
      border: outerBorder,
      innerBorder,
      outerBorder,
      faceImage,
      nameText
    };

    // Criar timer para fechar o diálogo após 6 segundos
    npc.dialogBox.timer = this.time.delayedCall(6000, () => {
      this.closeDialog(npc);
    });

    // Adicionar tecla de espaço para avançar o diálogo
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey?.once('down', () => {
      if (npc.dialogBox?.timer) {
        npc.dialogBox.timer.destroy();
      }
      this.closeDialog(npc);
    });

    npc.currentDialogIndex = (npc.currentDialogIndex + 1) % npc.dialog.length;
  }

  private closeDialog(npc: NPC): void {
    if (npc.dialogBox) {
      if (npc.dialogBox.timer) {
        npc.dialogBox.timer.destroy();
      }
      npc.dialogBox.background.destroy();
      npc.dialogBox.text.destroy();
      npc.dialogBox.border.destroy();
      npc.dialogBox.innerBorder.destroy();
      npc.dialogBox.outerBorder.destroy();
      npc.dialogBox.faceImage.destroy();
      npc.dialogBox.nameText.destroy();
      npc.dialogBox = undefined;
    }
    this.dialogActive = false;
  }

  private closeAllDialogs(): void {
    this.npcs.forEach(npc => {
      this.closeDialog(npc);
    });
  }
}