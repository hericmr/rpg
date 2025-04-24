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
  patrolPoints?: {x: number, y: number}[];
  currentPatrolIndex?: number;
  isMoving?: boolean;
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

    // Gerenciar eventos de visibilidade da janela
    window.addEventListener('blur', () => this.handleGamePause());
    window.addEventListener('focus', () => this.handleGameResume());
  }

  private handleGamePause(): void {
    // Pausar todas as tweens ativas
    this.tweens.pauseAll();
    // Zerar velocidades
    if (this.player?.sprite) {
      this.player.sprite.setVelocity(0, 0);
    }
    this.npcs.forEach(npc => {
      if (npc.sprite) {
        npc.isMoving = false;
      }
    });
  }

  private handleGameResume(): void {
    // Retomar tweens
    this.tweens.resumeAll();
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

    // Priorizar movimento horizontal
    if (this.cursors.left?.isDown) {
      player.sprite.setVelocityX(-speed);
      player.sprite.setVelocityY(0);
    } else if (this.cursors.right?.isDown) {
      player.sprite.setVelocityX(speed);
      player.sprite.setVelocityY(0);
    }
    // Se não houver movimento horizontal, permitir movimento vertical
    else if (this.cursors.up?.isDown) {
      player.sprite.setVelocityX(0);
      player.sprite.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown) {
      player.sprite.setVelocityX(0);
      player.sprite.setVelocityY(speed);
    } else {
      // Nenhuma tecla pressionada
      player.sprite.setVelocityX(0);
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

      // Criar um grupo de física para as paredes e objetos
      const collisionGroup = this.physics.add.staticGroup();

      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          const tile = map[y][x];
          const tileX = x * tileSize;
          const tileY = y * tileSize;

          switch (tile) {
            case 'W':
              // Criar retângulo físico para a parede
              const wall = this.add.rectangle(tileX + tileSize/2, tileY + tileSize/2, tileSize, tileSize, 0x000000);
              this.physics.add.existing(wall, true); // true = static body
              collisionGroup.add(wall);
              wallsLayer.add(wall);
              break;
            case 'F':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              break;
            case 'D':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              const desk = this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'desk');
              this.physics.add.existing(desk, true);
              collisionGroup.add(desk);
              objectsLayer.add(desk);
              break;
            case 'C':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              const chair = this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'chair');
              this.physics.add.existing(chair, true);
              collisionGroup.add(chair);
              objectsLayer.add(chair);
              break;
            case 'T':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              const terminal = this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'terminal');
              this.physics.add.existing(terminal, true);
              collisionGroup.add(terminal);
              objectsLayer.add(terminal);
              break;
            case 'E':
              floorLayer.add(this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'floor'));
              const elevator = this.add.image(tileX + tileSize/2, tileY + tileSize/2, 'elevator');
              this.physics.add.existing(elevator, true);
              collisionGroup.add(elevator);
              objectsLayer.add(elevator);
              break;
          }
        }
      }

      // Adicionar colisão entre o player e todos os objetos
      if (this.player) {
        this.physics.add.collider(this.player.sprite, collisionGroup);
      }

      return { wallsLayer, floorLayer, objectsLayer };
    } catch (error) {
      console.error('Error creating office map:', error);
      // Em vez de retornar null, vamos criar um mapa básico com paredes
      const floorLayer = this.add.container();
      const wallsLayer = this.add.container();
      const objectsLayer = this.add.container();
      const collisionGroup = this.physics.add.staticGroup();

      // Criar paredes básicas
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          if (x === 0 || x === 19 || y === 0 || y === 19) {
            const wall = this.add.rectangle(x * 16 + 8, y * 16 + 8, 16, 16, 0x000000);
            this.physics.add.existing(wall, true);
            collisionGroup.add(wall);
            wallsLayer.add(wall);
          } else {
            floorLayer.add(this.add.image(x * 16 + 8, y * 16 + 8, 'floor'));
          }
        }
      }

      if (this.player) {
        this.physics.add.collider(this.player.sprite, collisionGroup);
      }

      return { wallsLayer, floorLayer, objectsLayer };
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
    this.npcs.forEach(npc => {
      if (!npc.patrolPoints) {
        // Definir pontos de patrulha para o NPC
        const tileSize = 16;
        npc.patrolPoints = [
          {x: 4 * tileSize, y: 5 * tileSize}, // Posição inicial
          {x: 8 * tileSize, y: 5 * tileSize}, // Ponto de patrulha 1
          {x: 8 * tileSize, y: 3 * tileSize}, // Ponto de patrulha 2
          {x: 4 * tileSize, y: 3 * tileSize}  // Ponto de patrulha 3
        ];
        npc.currentPatrolIndex = 0;
        npc.isMoving = false;
      }

      if (!npc.isMoving) {
        // Avançar para o próximo ponto de patrulha
        npc.currentPatrolIndex = (npc.currentPatrolIndex! + 1) % npc.patrolPoints.length;
        const target = npc.patrolPoints[npc.currentPatrolIndex!];

        // Primeiro move horizontalmente, depois verticalmente
        const moveHorizontally = () => {
          if (target.x !== npc.sprite.x) {
            try {
              this.tweens.add({
                targets: npc.sprite,
                x: target.x,
                duration: 1000,
                ease: 'Linear',
                onStart: () => {
                  npc.isMoving = true;
                  // Virar o sprite na direção do movimento
                  npc.sprite.setFlipX(target.x < npc.sprite.x);
                },
                onComplete: () => {
                  if (this.scene.isActive()) {
                    moveVertically();
                  }
                }
              });
            } catch (error) {
              console.warn('Erro ao criar tween horizontal:', error);
              npc.isMoving = false;
            }
          } else {
            moveVertically();
          }
        };

        const moveVertically = () => {
          if (target.y !== npc.sprite.y) {
            try {
              this.tweens.add({
                targets: npc.sprite,
                y: target.y,
                duration: 1000,
                ease: 'Linear',
                onComplete: () => {
                  if (this.scene.isActive()) {
                    npc.isMoving = false;
                  }
                }
              });
            } catch (error) {
              console.warn('Erro ao criar tween vertical:', error);
              npc.isMoving = false;
            }
          } else {
            npc.isMoving = false;
          }
        };

        if (this.scene.isActive()) {
          moveHorizontally();
        }
      }
    });
  }
  
  private showDialog(npc: NPC): void {
    if (this.dialogActive) return;

    this.dialogActive = true;
    const dialogText = npc.dialog[npc.currentDialogIndex];

    // Ajustar tamanho proporcional à tela do jogo
    const screenWidth = Number(this.game.config.width);
    const screenHeight = Number(this.game.config.height);
    
    const dialogWidth = screenWidth * 1;
    const dialogHeight = screenHeight * 0.35;
    const padding = 11;

    const x = screenWidth / 2;
    const y = screenHeight - (dialogHeight / 2) - padding;

    // Criar a imagem do rosto por trás
    const faceImage = this.add.image(x - dialogWidth/99 + padding * 3, y - dialogHeight/1.1, 'lion2');
    faceImage.setScale(0.12);
    faceImage.setDepth(0);

    // Criar borda externa (branca)
    const outerBorder = this.add.rectangle(x, y, dialogWidth, dialogHeight, 0xFFFFFF);
    outerBorder.setDepth(1);
    
    // Criar borda interna (preta)
    const innerBorder = this.add.rectangle(x, y, dialogWidth - 4, dialogHeight - 4, 0x000000);
    innerBorder.setDepth(1);
    
    // Criar fundo branco para o texto
    const background = this.add.rectangle(x, y, dialogWidth - 8, dialogHeight - 8, 0xe43675);
    background.setDepth(1);

    // Adicionar o nome do NPC acima da imagem
    const nameText = this.add.text(x - dialogWidth/99 + padding * 3, y - dialogHeight/1.05 - 42 , 'Dr. Lion', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#000000',
      align: 'center'
    });
    nameText.setOrigin(0.5, 0);
    nameText.setDepth(2); // Centralizar o texto abaixo da imagem
    
    // Criar o texto do diálogo
    const text = this.add.text(x - dialogWidth/1.8 + padding * 2, y - dialogHeight/3, dialogText, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#000000',
      align: 'left',
      wordWrap: { width: dialogWidth - (padding * 4) }
    });
    text.setDepth(2);

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