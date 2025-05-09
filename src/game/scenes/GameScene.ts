// Escritório Corporativo da Corporação Caiçara - Torre Principal (Andar 87)
// SantosPunk 2099

import { Scene, GameObjects, Physics, Input, Types } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { GBC_COLORS } from '../config/colors';
import { CorporateOffice, SANTOSPUNK_CORPORATE_OFFICE, renderOfficeState } from '../config/office';
import { BaseScene } from './BaseScene';
import { NPCConfig } from '../controllers/NPCController';
import { InteractionController } from '../components/InteractionController';

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
  private gbEffect!: GBEffect;
  private currentTimeOfDay: string;
  private securityLevel: string;
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
  private interactionMenuController!: InteractionController;

  constructor() {
    super({ key: 'GameScene', active: false });
    this.office = renderOfficeState(SANTOSPUNK_CORPORATE_OFFICE, "manhã");
    this.currentTimeOfDay = "manhã";
    this.securityLevel = this.office.META_DATA.securityLevel;
  }

  init(data: { fromRight?: boolean }): void {
    if (data?.fromRight && this.playerController) {
        const map = this.make.tilemap({ key: 'mapa' });
        const player = this.playerController.getPlayer();
        if (player?.sprite) {
            player.sprite.x = map.widthInPixels - 32;
            player.sprite.y = map.heightInPixels / 2;
        }
    }
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
    this.load.image('player_portrait', `${publicUrl}/assets/hericrosto.png`);
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
    this.setupNPCs();
    this.interactionMenuController = new InteractionController(this);
    this.setupInteractions();
    this.setupCamera(map.widthInPixels, map.heightInPixels);
    this.setupCollisions([
      this.mapLayersCache.groundLayer,
      this.mapLayersCache.wallsLayer,
      this.mapLayersCache.cadeirasLayer,
      this.mapLayersCache.mesasLayer,
      this.mapLayersCache.computadoresLayer,
      this.mapLayersCache.jblLayer
    ].filter((layer): layer is Phaser.Tilemaps.TilemapLayer => layer !== undefined));

    // Setup event listeners after everything is initialized
    this.setupWindowEvents();
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
    let startX = 2 * map.tileWidth;
    let startY = 2 * map.tileHeight;

    const charStartLayer = map.objects.find(layer => layer.name === 'Char_start_place');
    if (charStartLayer && charStartLayer.objects.length > 0) {
      const spawnPoint = charStartLayer.objects[0];
      if (typeof spawnPoint.x === 'number' && typeof spawnPoint.y === 'number') {
        startX = spawnPoint.x;
        startY = spawnPoint.y;
      }
    }

    this.setupPlayer({
      startX,
      startY,
      spriteKey: 'player'
    });
  }

  protected setupNPCs(): void {
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

    this.office.OFFICE_NPCS.forEach((npcData: any) => {
      const patrolPoints = [
        { x: npcStartX, y: npcStartY },
        { x: npcStartX + 100, y: npcStartY },
        { x: npcStartX + 100, y: npcStartY + 100 },
        { x: npcStartX, y: npcStartY + 100 }
      ];

      const npcConfig: NPCConfig = {
        id: npcData.id,
        name: npcData.name,
        spriteKey: npcData.id === 'exec_1' ? 'lion' : 'player',
        position: { x: npcStartX, y: npcStartY },
        dialog: npcData.dialog || ['Olá!', 'Como posso ajudar?'],
        patrolPoints: patrolPoints,
        clearance: npcData.clearance,
        implants: npcData.implants
      };

      this.npcController.addNPC(npcConfig);
    });
  }

  protected setupInteractions(): void {
    const map = this.make.tilemap({ key: 'mapa' });
    const interactionLayer = map.getObjectLayer('JBL');
    console.log('[DEBUG] setupInteractions chamado');
    console.log('[DEBUG] interactionLayer:', interactionLayer);
    if (interactionLayer) {
      const interactionPoints = interactionLayer.objects.map(obj => ({
        x: obj.x || 0,
        y: obj.y || 0,
        radius: 50, // Raio padrão para interação
        type: 'jbl'
      }));
      console.log('[DEBUG] interactionPoints extraídos do mapa:', interactionPoints);
      interactionPoints.forEach(point => this.interactionMenuController.addInteractionPoint(point));
    }
    // Adiciona um ponto de interação manual para teste perto do player
    this.interactionMenuController.addInteractionPoint({
      x: 50,
      y: 50,
      radius: 100,
      type: 'jbl'
    });
    console.log('[DEBUG] Ponto de interação manual adicionado em (50,50)');
  }

  private setupWindowEvents(): void {
    const handleBlur = () => {
        if (this.scene.isActive()) {
            this.tweens.pauseAll();
            if (this.playerController?.getPlayer()?.sprite?.body) {
                this.playerController.getPlayer().sprite.setVelocity(0, 0);
            }
        }
    };

    const handleFocus = () => {
        if (this.scene.isActive()) {
            this.tweens.resumeAll();
        }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Clean up event listeners when scene is destroyed
    this.events.on('destroy', () => {
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
    });
  }

  update(): void {
    super.update();
    if (this.interactionMenuController) {
      this.interactionMenuController.update();
    }
    const player = this.playerController.getPlayer();
    if (!player?.sprite) return;

    const map = this.make.tilemap({ key: 'mapa' });
    if (player.sprite.x >= map.widthInPixels) {
      this.scene.start('VarandaScene');
      return;
    }
  }
}