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
  private interactionPoints?: { x: number; y: number; dialog: string }[];

  constructor() {
    super({ key: 'GameScene', active: false });
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

  init(data: { fromRight?: boolean }): void {
    // Se o jogador veio da direita, posicioná-lo no lado direito do mapa
    if (data?.fromRight) {
      const map = this.make.tilemap({ key: 'mapa' });
      if (this.player?.sprite) {
        this.player.sprite.x = map.widthInPixels - 32;
        this.player.sprite.y = map.heightInPixels / 2;
      }
    }
  }

  private handleGamePause(): void {
    // Pausar todas as tweens ativas
    this.tweens.pauseAll();
    // Zerar velocidades
    if (this.player?.sprite && this.player.sprite.body) {
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
    const publicUrl = process.env.PUBLIC_URL || '';
    this.setupAssetLoading();
    this.load.tilemapTiledJSON('mapa', `${publicUrl}/assets/mapa.tmx`);
    this.load.image('Room_Builder_free_16x16', `${publicUrl}/assets/Room_Builder_free_16x16.png`);
    this.load.image('Interiors_free_16x16', `${publicUrl}/assets/tileset.png`);
    this.load.spritesheet('player', `${publicUrl}/assets/heric2.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('lion', `${publicUrl}/assets/lion.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.image('lionface', `${publicUrl}/assets/lion_2.png`);
    this.load.image('wall', `${publicUrl}/assets/wall.svg`);
    this.load.image('floor', `${publicUrl}/assets/floor.svg`);
    this.load.image('desk', `${publicUrl}/assets/desk.svg`);
    this.load.image('chair', `${publicUrl}/assets/chair.svg`);
    this.load.image('terminal', `${publicUrl}/assets/terminal.svg`);
    this.load.image('elevator', `${publicUrl}/assets/elevator.svg`);
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
    const publicUrl = process.env.PUBLIC_URL || '';
    this.load.spritesheet('player', `${publicUrl}/assets/heric2.png`, {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('lion', `${publicUrl}/assets/lion2.png`, {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.image('lionface', `${publicUrl}/assets/lion_2.png`);
    this.load.image('wall', `${publicUrl}/assets/wall.svg`);
    this.load.image('floor', `${publicUrl}/assets/floor.svg`);
    this.load.image('desk', `${publicUrl}/assets/desk.svg`);
    this.load.image('chair', `${publicUrl}/assets/chair.svg`);
    this.load.image('terminal', `${publicUrl}/assets/terminal.svg`);
    this.load.image('elevator', `${publicUrl}/assets/elevator.svg`);
  }

  create(): void {
    // Configurar renderização pixel perfect
    this.textures.get('player').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('lion').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('lionface').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('wall').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('floor').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('desk').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('chair').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('terminal').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('elevator').setFilter(Phaser.Textures.FilterMode.NEAREST);
    
    this.initializeGameSystems();
    
    const map = this.make.tilemap({ key: 'mapa' });
    
    // Adicionar os tilesets
    const tileset1 = map.addTilesetImage('Room_Builder_free_16x16', 'Room_Builder_free_16x16');
    const tileset2 = map.addTilesetImage('Interiors_free_16x16', 'Interiors_free_16x16');
    
    if (!tileset1 || !tileset2) {
      throw new Error('Tilesets não encontrados!');
    }

    // Debug: Verificar camadas do mapa
    console.log('Camadas do mapa:', map.layers);
    map.layers.forEach(layer => {
      console.log(`Camada ${layer.name}:`, {
        propriedades: layer.properties,
        visível: layer.visible
      });
    });

    // Adicionar imagem de fundo e ajustar escala
    const bg = this.add.image(0, 0, 'mapImage').setOrigin(0, 0);
    bg.setScale((map.widthInPixels / bg.width) - 0.01, (map.heightInPixels / bg.height) - 0.01);

    // Criar as camadas usando ambos os tilesets
    const groundLayer = map.createLayer('ground', [tileset1, tileset2], 0, 0);
    const wallsLayer = map.createLayer('walls', [tileset1, tileset2], 0, 0);
    const objectsLayer = map.createLayer('objects', [tileset1, tileset2], 0, 0);
    const objects2Layer = map.createLayer('objects2', [tileset1, tileset2], 0, 0);
    const objects3Layer = map.createLayer('objects3', [tileset1, tileset2], 0, 0);
    const objects4Layer = map.createLayer('objects4', [tileset1, tileset2], 0, 0);

    // Debug: Verificar se as camadas foram criadas
    console.log('Camadas criadas:', {
      groundLayer: !!groundLayer,
      wallsLayer: !!wallsLayer,
      objectsLayer: !!objectsLayer,
      objects2Layer: !!objects2Layer,
      objects3Layer: !!objects3Layer,
      objects4Layer: !!objects4Layer
    });

    // Procurar o tile 1547 em qualquer camada de tile
    let startX = 2 * map.tileWidth;
    let startY = 2 * map.tileHeight;
    map.layers.forEach(layer => {
      if (layer.tilemapLayer) {
        layer.tilemapLayer.forEachTile(tile => {
          if (tile.index === 1547) {
            startX = tile.pixelX + map.tileWidth / 2;
            startY = tile.pixelY + map.tileHeight / 2;
          }
        });
      }
    });

    this.player = {
      sprite: this.physics.add.sprite(startX, startY, 'player'),
      inventory: [],
      stats: {
        clearance: "Branco",
        implants: []
      }
    };
    this.player.sprite.setSize(12, 12);
    this.player.sprite.setOffset(2, 2);

    // Configurar a câmera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(true);
    
    // Configurar colisões para todas as camadas
    const collidableLayers = [wallsLayer, objectsLayer, objects2Layer, objects3Layer, objects4Layer];
    collidableLayers.forEach(layer => {
      if (layer) {
        // Verifica se a camada tem a propriedade collides: true
        const layerHasCollision = layer.layer.properties?.some(
          (prop: any) => prop.name === 'collides' && prop.value === true
        );
        if (layerHasCollision) {
          // Ativa colisão para todos os tiles da camada
          layer.setCollisionBetween(0, 9999, true);
          this.physics.add.collider(this.player.sprite, layer);
          console.log(`Colisão ativada para a camada ${layer.layer.name} por propriedade da camada.`);
        } else {
          // Mantém a colisão por propriedade de tile também
          layer.setCollisionByProperty({ collides: true });
          this.physics.add.collider(this.player.sprite, layer);
        }
      }
    });
    
    // NPCs e input
    this.setupNPCs();
    this.setupInput();

    // Carregar a camada de interação
    const interactionLayer = map.getObjectLayer('interaction');
    console.log('Interaction layer:', interactionLayer); // Debug log
    
    if (interactionLayer) {
      this.interactionPoints = interactionLayer.objects.map(obj => {
        console.log('Interaction object:', obj); // Debug log
        return {
          x: obj.x || 0,
          y: obj.y || 0,
          dialog: obj.properties?.find((p: { name: string; value: string }) => p.name === 'interaction')?.value === 'JBL' 
            ? 'Caraca essa JBL depois do upgrade ficou bem forte botente'
            : obj.properties?.find((p: { name: string; value: string }) => p.name === 'interaction')?.value || ''
        };
      });
      console.log('Interaction points:', this.interactionPoints); // Debug log
    }
  }

  private initializeGameSystems(): void {
    // Add Game Boy Color pipeline
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer && (renderer as any).pipelines) {
      renderer.pipelines.add('GBEffect', new GBPipeline(this.game));
      // Initialize Game Boy Color effect
      this.gbEffect = new GBEffect(this);
    } else {
      // Tenta novamente após um pequeno delay
      this.time.delayedCall(100, () => this.initializeGameSystems());
    }
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
    if (!this.player?.sprite) return;

    // Verificar se o jogador saiu pela direita
    const map = this.make.tilemap({ key: 'mapa' });
    if (this.player.sprite.x >= map.widthInPixels) {
      this.scene.start('VarandaScene');
      return;
    }

    if (this.dialogActive) return;

    // Movimento horizontal
    if (this.cursors.left?.isDown) {
      this.player.sprite.setVelocityX(-100);
    } else if (this.cursors.right?.isDown) {
      this.player.sprite.setVelocityX(100);
    } else {
      this.player.sprite.setVelocityX(0);
    }

    // Movimento vertical
    if (this.cursors.up?.isDown) {
      this.player.sprite.setVelocityY(-100);
    } else if (this.cursors.down?.isDown) {
      this.player.sprite.setVelocityY(100);
    } else {
      this.player.sprite.setVelocityY(0);
    }
    
    this.checkInteractions();
    this.updateNPCs();
  }

  private checkInteractions(): void {
    if (!this.input.keyboard) return;
    
    const spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    if (spaceKey.isDown) {
      console.log('Space key pressed'); // Debug log
      this.checkNPCInteractions();
      this.checkObjectInteractions();
      this.checkInteractionPoints();
    }
  }

  private checkNPCInteractions(): void {
    const playerBounds = this.player.sprite.getBounds();
    const interactionDistance = 64; // Aumentar a distância de interação
    
    this.npcs.forEach((npc, id) => {
      const npcBounds = npc.sprite.getBounds();
      const distance = Phaser.Math.Distance.Between(
        playerBounds.centerX,
        playerBounds.centerY,
        npcBounds.centerX,
        npcBounds.centerY
      );
      
      if (distance <= interactionDistance) {
        this.showDialog(npc);
      }
    });
  }

  private checkObjectInteractions(): void {
    // Implementar interação com objetos do escritório
  }

  private checkInteractionPoints(): void {
    if (!this.interactionPoints) {
      console.log('No interaction points found');
      return;
    }

    const playerBounds = this.player.sprite.getBounds();
    const interactionDistance = 24;

    for (const point of this.interactionPoints) {
      const distance = Phaser.Math.Distance.Between(
        playerBounds.centerX,
        playerBounds.centerY,
        point.x,
        point.y
      );

      console.log('Distance to interaction point:', distance); // Debug log

      if (distance <= interactionDistance) {
        console.log('Showing dialog for point:', point); // Debug log
        this.showDialog({
          sprite: this.add.sprite(0, 0, 'player'),
          dialog: [point.dialog],
          currentDialogIndex: 0
        });
        break;
      }
    }
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

    const playerSprite = this.physics.add.sprite(startX, startY, 'player');
    
    // Ajustar o tamanho do corpo de colisão do jogador para ficar mais próximo dos objetos
    playerSprite.setSize(12, 12); // Reduzido de 14 para 12
    playerSprite.setOffset(2, 2); // Ajustado de 1 para 2 para centralizar melhor
    
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
    this.cameras.main.setZoom(2); // Aumentar o zoom para 2x
  }

  private createNPCs(): void {
    this.office.OFFICE_NPCS.forEach((npcData: NPCData) => {
      const npcSprite = this.add.sprite(
        npcData.position.x * 16,
        npcData.position.y * 16,
        npcData.id === 'exec_1' ? 'lion' : 'player'
      );

      this.physics.add.existing(npcSprite);
      
      // Reduzir o tamanho da colisão do NPC
      if (npcSprite.body) {
        (npcSprite.body as Physics.Arcade.Body).setSize(8, 8);
        (npcSprite.body as Physics.Arcade.Body).setOffset(4, 4);
      }
      
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
      // Dr. Lion não se move
      if (npc.sprite.texture.key === 'lion') {
        return;
      }

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

    // Criar o diálogo
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const x = screenWidth / 2;
    const y = screenHeight * 0.7;

    // Criar a imagem do rosto por trás
    const faceImage = this.add.image(x - screenWidth/4, y - screenHeight/2, 'lionface');
    faceImage.setScrollFactor(0);
    faceImage.setScale(0.5);
    faceImage.setDepth(0);

    // Criar borda externa (branca)
    const outerBorder = this.add.rectangle(x, y, screenWidth * 0.9, screenHeight * 0.3, 0xFFFFFF);
    outerBorder.setScrollFactor(0);
    outerBorder.setDepth(1);
    
    // Criar borda interna (preta)
    const innerBorder = this.add.rectangle(x, y, screenWidth * 0.9 - 4, screenHeight * 0.3 - 4, 0x000000);
    innerBorder.setScrollFactor(0);
    innerBorder.setDepth(1);
    
    // Criar fundo branco para o texto
    const background = this.add.rectangle(x, y, screenWidth * 0.9 - 8, screenHeight * 0.3 - 8, 0xe43675);
    background.setScrollFactor(0);
    background.setDepth(1);

    // Criar o texto do diálogo
    const text = this.add.text(x, y, dialogText, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#000000',
      wordWrap: { width: screenWidth * 0.8 }
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(2);

    // Criar o nome do NPC
    const nameText = this.add.text(x - screenWidth * 0.4, y - screenHeight * 0.12, 'DR. Lion', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#000000'
    });
    nameText.setOrigin(0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(2);

    // Armazenar referências para o diálogo
    npc.dialogBox = {
      background,
      text,
      border: innerBorder,
      innerBorder,
      outerBorder,
      faceImage,
      nameText
    };

    // Criar timer para fechar o diálogo após 6 segundos
    if (npc.dialogBox) {
      npc.dialogBox.timer = this.time.delayedCall(6000, () => {
        this.closeDialog(npc);
      });
    }

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