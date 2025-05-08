// Escritório Corporativo da Corporação Caiçara - Torre Principal (Andar 87)
// SantosPunk 2099

import { Scene, GameObjects, Physics, Input, Types } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { GBC_COLORS } from '../config/colors';
import { CorporateOffice, SANTOSPUNK_CORPORATE_OFFICE, renderOfficeState } from '../config/office';
import { BaseScene, NPC, Player } from './BaseScene';

// Interfaces para melhor tipagem
interface MapLayers {
  wallsLayer: GameObjects.Container;
  floorLayer: GameObjects.Container;
  objectsLayer: GameObjects.Container;
}

interface NPCData {
    id: string;
    name: string;
    position: {x: number, y: number};
    implants: string[];
    clearance: string;
    dialog: string[];
}

export default class GameScene extends BaseScene {
  private office: CorporateOffice;
  private npcs: Map<string, NPC>;
  private mapLayers: MapLayers | null;
  private gbEffect!: GBEffect;
  private currentTimeOfDay: string;
  private securityLevel: string;
  protected player!: Player;
  protected cursors: {
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
    space?: Phaser.Input.Keyboard.Key;
  } = {};
  protected dialogActive: boolean;
  protected interactionPoints?: { x: number; y: number; dialog: string }[];
  private closeDialogKey!: Input.Keyboard.Key;
  private mapLayersCache: {
    groundLayer: Phaser.Tilemaps.TilemapLayer | undefined;
    wallsLayer: Phaser.Tilemaps.TilemapLayer | undefined;
    cadeirasLayer: Phaser.Tilemaps.TilemapLayer | undefined;
    mesasLayer: Phaser.Tilemaps.TilemapLayer | undefined;
    computadoresLayer: Phaser.Tilemaps.TilemapLayer | undefined;
    jblLayer: Phaser.Tilemaps.TilemapLayer | undefined;
  } = {
    groundLayer: undefined,
    wallsLayer: undefined,
    cadeirasLayer: undefined,
    mesasLayer: undefined,
    computadoresLayer: undefined,
    jblLayer: undefined
  };

  constructor() {
    super({ key: 'GameScene', active: false });
    this.office = renderOfficeState(SANTOSPUNK_CORPORATE_OFFICE, "manhã");
    this.currentTimeOfDay = "manhã";
    this.securityLevel = this.office.META_DATA.securityLevel;
    this.npcs = new Map();
    this.mapLayers = null;
    this.dialogActive = false;

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
    this.load.tilemapTiledJSON('mapa', `${publicUrl}/assets/escritorio.json`);
    this.load.image('Interiors_free_16x16', `${publicUrl}/assets/tileset.png`);
    this.load.image('Interior general', `${publicUrl}/assets/Interior general.png`);
    this.load.spritesheet('player', `${publicUrl}/assets/heric2.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('lion', `${publicUrl}/assets/lion2.png`, { frameWidth: 16, frameHeight: 16 });
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
    this.setupPixelPerfectRendering();
    this.initializeGBEffect();
    
    const map = this.make.tilemap({ key: 'mapa' });
    const tileset = map.addTilesetImage('Interior general', 'Interior general');
    
    if (!tileset) {
      throw new Error('Tilesets não encontrados!');
    }

    this.createMapLayers(map, tileset);
    this.setupPlayerFromMap(map);
    this.setupCamera(map.widthInPixels, map.heightInPixels);
    this.setupCollisionsFromMap(map);
    this.setupNPCs();
    this.setupInput();
    this.setupInteractions(map);
  }

  private setupPixelPerfectRendering(): void {
    const textures = ['player', 'lion', 'lionface', 'wall', 'floor', 'desk', 'chair', 'terminal', 'elevator'];
    textures.forEach(texture => {
      this.textures.get(texture).setFilter(Phaser.Textures.FilterMode.NEAREST);
    });
  }

  private initializeGBEffect(): void {
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (renderer && (renderer as any).pipelines) {
      renderer.pipelines.add('GBEffect', new GBPipeline(this.game));
      this.gbEffect = new GBEffect(this);
    } else {
      this.time.delayedCall(100, () => this.initializeGBEffect());
    }
  }

  private createMapLayers(map: Phaser.Tilemaps.Tilemap, tileset: Phaser.Tilemaps.Tileset): void {
    const groundLayer = map.createLayer('ground', tileset, 0, 0);
    const wallsLayer = map.createLayer('walls', tileset, 0, 0);
    const cadeirasLayer = map.createLayer('cadeiras', tileset, 0, 0);
    const mesasLayer = map.createLayer('mesas', tileset, 0, 0);
    const computadoresLayer = map.createLayer('computadores', tileset, 0, 0);
    const jblLayer = map.createLayer('jbl', tileset, 0, 0);

    this.mapLayersCache = {
      groundLayer: groundLayer || undefined,
      wallsLayer: wallsLayer || undefined,
      cadeirasLayer: cadeirasLayer || undefined,
      mesasLayer: mesasLayer || undefined,
      computadoresLayer: computadoresLayer || undefined,
      jblLayer: jblLayer || undefined
    };

    if (!this.mapLayersCache.groundLayer || !this.mapLayersCache.wallsLayer || !this.mapLayersCache.cadeirasLayer || 
        !this.mapLayersCache.mesasLayer || !this.mapLayersCache.computadoresLayer || 
        !this.mapLayersCache.jblLayer) {
      throw new Error('Erro ao criar camadas do mapa');
    }
  }

  private setupPlayerFromMap(map: Phaser.Tilemaps.Tilemap): void {
    // Posição inicial padrão
    let startX = 2 * map.tileWidth;
    let startY = 2 * map.tileHeight;

    // Procurar pelo ponto de spawn do jogador na camada Char_start_place
    const charStartLayer = map.objects.find(layer => layer.name === 'Char_start_place');
    if (charStartLayer && charStartLayer.objects.length > 0) {
      const spawnPoint = charStartLayer.objects[0];
      if (typeof spawnPoint.x === 'number' && typeof spawnPoint.y === 'number') {
        startX = spawnPoint.x;
        startY = spawnPoint.y;
      }
    }

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
    this.player.sprite.setScale(2);

    // Configurar a câmera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setZoom(1);
    this.cameras.main.setRoundPixels(true);
    
    // Configurar colisões para todas as camadas
    const collidableLayers = [this.mapLayersCache.groundLayer, this.mapLayersCache.wallsLayer, this.mapLayersCache.cadeirasLayer, this.mapLayersCache.mesasLayer, this.mapLayersCache.computadoresLayer, this.mapLayersCache.jblLayer];
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
        }
      }
    });
  }

  private setupCollisionsFromMap(map: Phaser.Tilemaps.Tilemap): void {
    const collidableLayers = [
      this.mapLayersCache.groundLayer,
      this.mapLayersCache.wallsLayer,
      this.mapLayersCache.cadeirasLayer,
      this.mapLayersCache.mesasLayer,
      this.mapLayersCache.computadoresLayer,
      this.mapLayersCache.jblLayer
    ].filter((layer): layer is Phaser.Tilemaps.TilemapLayer => layer !== undefined);

    if (this.player?.sprite) {
      collidableLayers.forEach(layer => {
        this.physics.add.collider(this.player.sprite, layer);
      });
    }
  }

  private setupNPCs(): void {
    // Procurar pelo ponto de spawn do NPC na camada Npc_start_place
    const map = this.make.tilemap({ key: 'mapa' });
    const npcStartLayer = map.objects.find(layer => layer.name === 'Npc_start_place');
    let npcStartX = 0;
    let npcStartY = 0;

    if (npcStartLayer && npcStartLayer.objects.length > 0) {
      const spawnPoint = npcStartLayer.objects[0];
      if (typeof spawnPoint.x === 'number' && typeof spawnPoint.y === 'number') {
        npcStartX = spawnPoint.x;
        npcStartY = spawnPoint.y;
      }
    }

    this.office.OFFICE_NPCS.forEach((npcData: NPCData) => {
      const npcSprite = this.add.sprite(
        npcStartX,
        npcStartY,
        npcData.id === 'exec_1' ? 'lion' : 'player'
      );

      this.physics.add.existing(npcSprite);
      
      if (npcSprite.body) {
        (npcSprite.body as Physics.Arcade.Body).setSize(8, 8);
        (npcSprite.body as Physics.Arcade.Body).setOffset(4, 4);
        (npcSprite.body as Physics.Arcade.Body).setImmovable(true);
      }
      
      npcSprite.setScale(2);
      
      if (this.mapLayers) {
        this.physics.add.collider(npcSprite, this.mapLayers.wallsLayer);
      }

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

  private setupInteractions(map: Phaser.Tilemaps.Tilemap): void {
    const interactionLayer = map.getObjectLayer('JBL');
    if (interactionLayer) {
      this.interactionPoints = interactionLayer.objects.map(obj => ({
        x: obj.x || 0,
        y: obj.y || 0,
        dialog: obj.properties?.find((p: { name: string; value: string }) => p.name === 'interaction')?.value === 'JBL' 
          ? 'Caraca essa JBL depois do overclock ficou bem forte potente'
          : obj.properties?.find((p: { name: string; value: string }) => p.name === 'interaction')?.value || ''
      }));
    }
  }

  update(): void {
    if (!this.player?.sprite) return;

    // Verificar se o jogador saiu pela direita
    const map = this.make.tilemap({ key: 'mapa' });
    if (this.player.sprite.x >= map.widthInPixels) {
      this.scene.start('VarandaScene');
      return;
    }

    this.handleMovement();
    this.checkInteractions();
    this.updateNPCs();
  }

  protected handleMovement(): void {
    if (!this.player?.sprite || !this.cursors || this.dialogActive) return;

    const speed = 160;
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left?.isDown) {
      velocityX = -speed;
      this.player.sprite.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      velocityX = speed;
      this.player.sprite.setFlipX(false);
    }

    if (this.cursors.up?.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down?.isDown) {
      velocityY = speed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Math.SQRT1_2;
      velocityY *= Math.SQRT1_2;
    }

    this.player.sprite.setVelocity(velocityX, velocityY);

    // Update animation
    if (velocityX !== 0 || velocityY !== 0) {
      this.player.sprite.anims.play('walk', true);
    } else {
      this.player.sprite.anims.play('idle', true);
    }
  }

  protected checkInteractions(): void {
    if (!this.player?.sprite || this.dialogActive) return;

    const interactionDistance = 32;
    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Only check interactions if space key is pressed
    if (spaceKey?.isDown) {
      // Check NPC interactions
      this.npcs.forEach(npc => {
        if (!npc.sprite) return;

        const distance = Phaser.Math.Distance.Between(
          this.player.sprite.x,
          this.player.sprite.y,
          npc.sprite.x,
          npc.sprite.y
        );

        if (distance <= interactionDistance) {
          this.showNPCDialog(npc);
        }
      });

      // Check interaction points
      this.interactionPoints?.forEach(point => {
        const distance = Phaser.Math.Distance.Between(
          this.player.sprite.x,
          this.player.sprite.y,
          point.x,
          point.y
        );

        if (distance <= interactionDistance) {
          console.log('Showing dialog for point:', point);
          this.showNPCDialog({
            sprite: this.add.sprite(0, 0, 'player'),
            dialog: [point.dialog],
            currentDialogIndex: 0
          });
        }
      });
    }
  }

  private updateNPCs(): void {
    this.npcs.forEach(npc => {
      if (npc.sprite.texture.key === 'lion') return;

      if (!npc.patrolPoints) {
        const tileSize = 16;
        npc.patrolPoints = [
          {x: 4 * tileSize, y: 5 * tileSize},
          {x: 8 * tileSize, y: 5 * tileSize},
          {x: 8 * tileSize, y: 3 * tileSize},
          {x: 4 * tileSize, y: 3 * tileSize}
        ];
        npc.currentPatrolIndex = 0;
        npc.isMoving = false;
      }

      if (!npc.isMoving) {
        this.moveNPC(npc);
      }
    });
  }

  private moveNPC(npc: NPC): void {
    if (!npc.patrolPoints || npc.currentPatrolIndex === undefined) return;

    npc.currentPatrolIndex = (npc.currentPatrolIndex + 1) % npc.patrolPoints.length;
    const target = npc.patrolPoints[npc.currentPatrolIndex];

    const moveHorizontally = () => {
      if (target.x !== npc.sprite.x) {
        this.tweens.add({
          targets: npc.sprite,
          x: target.x,
          duration: 1000,
          ease: 'Linear',
          onStart: () => {
            npc.isMoving = true;
            npc.sprite.setFlipX(target.x < npc.sprite.x);
          },
          onComplete: () => {
            if (this.scene.isActive()) {
              moveVertically();
            }
          }
        });
      } else {
        moveVertically();
      }
    };

    const moveVertically = () => {
      if (target.y !== npc.sprite.y) {
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
      } else {
        npc.isMoving = false;
      }
    };

    if (this.scene.isActive()) {
      moveHorizontally();
    }
  }
  
  protected showNPCDialog(npc: NPC, isPlayerThought: boolean = false): void {
    if (this.dialogActive) return;

    this.dialogActive = true;
    const dialogText = npc.dialog[npc.currentDialogIndex];

    // Criar o diálogo
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const x = screenWidth / 2;
    const y = screenHeight - (screenHeight * 0.15);

    // Definir cores baseado no tipo de diálogo
    const dialogColor = isPlayerThought ? 0x1a237e : 0xe43675; // Azul marinho para pensamentos, rosa para NPCs
    const textColor = '#FFFFFF'; // Texto branco para ambos os casos

    // Criar a imagem do rosto por trás (apenas para NPCs)
    let faceImage: GameObjects.Image | undefined;
    if (!isPlayerThought) {
      faceImage = this.add.image(x - screenWidth/4, y - screenHeight/4, 'lionface');
      faceImage.setScrollFactor(0);
      faceImage.setScale(0.3);
      faceImage.setDepth(0);
    }

    // Criar borda externa (branca)
    const outerBorder = this.add.rectangle(x, y, screenWidth * 0.9, screenHeight * 0.3, 0xFFFFFF);
    outerBorder.setScrollFactor(0);
    outerBorder.setDepth(1);
    
    // Criar borda interna (preta)
    const innerBorder = this.add.rectangle(x, y, screenWidth * 0.9 - 4, screenHeight * 0.3 - 4, 0x000000);
    innerBorder.setScrollFactor(0);
    innerBorder.setDepth(1);
    
    // Criar fundo colorido para o texto
    const background = this.add.rectangle(x, y, screenWidth * 0.9 - 8, screenHeight * 0.3 - 8, dialogColor);
    background.setScrollFactor(0);
    background.setDepth(1);

    // Criar o texto do diálogo
    const text = this.add.text(x, y, dialogText, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: textColor,
      wordWrap: { width: screenWidth * 0.8 }
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(2);

    // Criar o nome do NPC ou "Você" para pensamentos
    const nameText = this.add.text(x - screenWidth * 0.4, y - screenHeight * 0.12, isPlayerThought ? 'Você' : 'DR. Lion', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: textColor
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
      npc.dialogBox.faceImage?.destroy();
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