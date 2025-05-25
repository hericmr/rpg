// Escritório Corporativo da Corporação Caiçara - Torre Principal (Andar 87)
// SantosPunk 2099

import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { CorporateOffice, SANTOSPUNK_CORPORATE_OFFICE, renderOfficeState } from '../config/office';
import { BaseScene } from './BaseScene';
import InteractionController from '../controllers/InteractionController';
import { DialogBox } from '../components/DialogBox';
import { NPCConfig } from '../controllers/NPCController';
import { InitialDialog } from '../components/InitialDialog';
import GameState from '../state/GameState';

interface SceneData {
    fromVaranda?: boolean;
}

export default class GameScene extends BaseScene {
    private office: CorporateOffice;
    private gbEffect!: GBEffect;
    private currentTimeOfDay: "manhã" | "tarde" | "noite";
    private securityLevel: number;
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

  private initialDialog: InitialDialog | null = null;

  constructor() {
    super({ key: 'GameScene', active: false });
    this.office = renderOfficeState(SANTOSPUNK_CORPORATE_OFFICE, "manhã");
    this.currentTimeOfDay = "manhã";
        this.securityLevel = Number(this.office.META_DATA.securityLevel);
  }

  init(data: SceneData): void {
        // Ensure controllers are properly initialized first
        this.tryInitializeInteractionController();
        
    if (data?.fromVaranda) {
        // Wait for the map to be created in the next frame
        this.events.once('create', () => {
            const map = this.make.tilemap({ key: 'mapa' });
            const player = this.playerController?.getPlayer();
            if (player?.sprite) {
                // Position player at the right edge of the map, slightly inset
                player.sprite.x = map.widthInPixels - (2 * map.tileWidth); // Two tiles from the right edge
                player.sprite.y = map.heightInPixels / 2; // Middle of the map vertically
                // Make sure player is facing left when entering
                player.sprite.setFlipX(true);
            }

                // Ensure controllers are properly initialized
                if (this.interactionController) {
                    console.log('[GameScene] Reinitializing interaction controller after varanda return');
                    this.interactionController.init();
                }
                
                // Re-setup interactions to ensure everything is properly connected
                this.setupInteractions();
                console.log('[GameScene] Setup complete after varanda return');
        });
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
    this.load.image('hericrosto_morder', `${publicUrl}/assets/hericrosto_morder.png`);
    this.load.image('hericrostoolhar', `${publicUrl}/assets/hericrosto_olhar.png`);
    this.load.image('wall', `${publicUrl}/assets/wall.svg`);
    this.load.image('floor', `${publicUrl}/assets/floor.svg`);
    this.load.image('desk', `${publicUrl}/assets/desk.svg`);
    this.load.image('chair', `${publicUrl}/assets/chair.svg`);
    this.load.image('terminal', `${publicUrl}/assets/terminal.svg`);
    this.load.image('elevator', `${publicUrl}/assets/elevator.svg`);
    this.load.audio('lesbica_futurista', `${publicUrl}/assets/lesbica_futurista.mp3`);
    this.load.image('heric', `${publicUrl}/assets/hericrosto.png`);
  }

  private setupAssetLoading(): void {
    this.load.on('filecomplete', (key: string) => {
      console.log(`Asset carregado: ${key}`);
    });
    
    this.load.on('loaderror', (fileObj: Phaser.Types.Loader.FileConfig) => {
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
    super.create(); // Call parent's create to initialize controllers
    
    // Add wake-up fade effect only on first load
    const gameState = GameState.getInstance();
    if (!gameState.hasOpenedGameScene) {
    const blackOverlay = this.add.rectangle(
      0, 
      0, 
      this.scale.width * 2, // Make sure it covers the entire game area
      this.scale.height * 2, 
      0x1a0f2e // Dark purple color for a more dreamy wake-up
    )
      .setOrigin(0)
      .setDepth(1000)
      .setScrollFactor(0);
      
    this.tweens.add({
      targets: blackOverlay,
      alpha: { from: 1, to: 0 },
      duration: 3000,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        blackOverlay.destroy();
      }
    });

      gameState.hasOpenedGameScene = true;
    }
    
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

    // Mostrar diálogo inicial apenas se não vier da varanda
    const sceneData = this.scene.settings.data as SceneData;
    if (!sceneData?.fromVaranda) {
      this.initialDialog = new InitialDialog(this);
      this.initialDialog.show();
    }
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

    // Configurar colisões
    this.mapLayersCache.wallsLayer.setCollisionByProperty({ collides: true });
    this.mapLayersCache.cadeirasLayer.setCollisionByExclusion([-1]);
    this.mapLayersCache.mesasLayer.setCollisionByExclusion([-1]);
    this.mapLayersCache.computadoresLayer.setCollisionByExclusion([-1]);
    this.mapLayersCache.jblLayer.setCollisionByExclusion([-1]);

    // Tornar as camadas de colisão visíveis para debug (opcional)
    const debugGraphics = this.add.graphics().setAlpha(0.75);
    this.mapLayersCache.wallsLayer.renderDebug(debugGraphics, {
      tileColor: null,
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
      faceColor: new Phaser.Display.Color(40, 39, 37, 255)
    });
  }

  private setupPlayerFromMap(map: Phaser.Tilemaps.Tilemap): void {
    let startX = 2 * map.tileWidth;
    let startY = map.heightInPixels / 2;

    // Se a cena anterior foi a VarandaScene, posiciona o jogador na extremidade direita
    const sceneData = this.scene.settings.data as SceneData;
    const fromVaranda = sceneData?.fromVaranda;
    if (fromVaranda) {
      startX = map.widthInPixels - (2 * map.tileWidth); // Duas tiles da borda direita
    }

    const charStartLayer = map.objects.find(layer => layer.name === 'Char_start_place');
    if (!fromVaranda && charStartLayer && charStartLayer.objects.length > 0) {
      const spawnPoint = charStartLayer.objects[0];
      if (typeof spawnPoint.x === 'number' && typeof spawnPoint.y === 'number') {
        startX = spawnPoint.x;
        startY = spawnPoint.y;
      }
    }

    this.setupPlayer({
      startX,
      startY,
      spriteKey: 'player',
      clearance: 'employee'
    });

    // Se vier da varanda, vira o personagem para a esquerda
    if (fromVaranda) {
      const player = this.playerController.getPlayer();
      if (player?.sprite) {
        player.sprite.setFlipX(true);
      }
    }
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

      // Customizar diálogos baseados no ID do NPC
      let npcDialogs;
      switch (npcData.id) {
        case 'exec_1':
          npcDialogs = [
            'Zzz... não devia ter misturado pinga com absinto... ouço a voz de Gaia voltou...'
          ];
          break;
        case 'security_1':
          npcDialogs = [
            'Ei! Esta área é restrita!'
          ];
          break;
        case 'employee_1':
          npcDialogs = [
            'Mais um dia na Corporação loftjur...'
          ];
          break;
        default:
          npcDialogs = [
            'Olá! Como vai?',
            'Bastante trabalho hoje, não?',
            'Você é novo por aqui?',
            'Prazer em conhecê-lo!'
          ];
      }

      const npcConfig: NPCConfig = {
        id: npcData.id,
        name: npcData.name,
        spriteKey: npcData.id === 'exec_1' ? 'lion' : 'player',
        position: { x: npcStartX, y: npcStartY },
        dialog: npcDialogs,
        patrolPoints: patrolPoints,
        clearance: npcData.clearance,
        implants: npcData.implants
      };

      this.npcController.addNPC(npcConfig);
    });
  }

  protected setupInteractions(): void {
        console.log('[DEBUG] setupInteractions iniciando');
        if (!this.interactionController) {
            console.error('[DEBUG] interactionController não está inicializado!');
            return;
        }

    const map = this.make.tilemap({ key: 'mapa' });
    const interactionLayer = map.getObjectLayer('JBL');
    console.log('[DEBUG] interactionLayer:', interactionLayer);

        // Reset interaction points by creating a new array
        this.interactionController.addInteractionPoints([]);

    if (interactionLayer) {
      const interactionPoints = interactionLayer.objects.map(obj => ({
        x: obj.x || 0,
        y: obj.y || 0,
                radius: 50,
        type: 'jbl',
        dialog: 'Uma JBL com overclock, superpotente... atinge 99 mil decibeis.'
      }));
      console.log('[DEBUG] interactionPoints extraídos do mapa:', interactionPoints);
      this.interactionController.addInteractionPoints(interactionPoints);
        }
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
    const player = this.playerController.getPlayer();
    if (!player?.sprite) return;

    const map = this.make.tilemap({ key: 'mapa' });
    if (player.sprite.x >= map.widthInPixels) {
      this.scene.start('VarandaScene');
      return;
    }
  }
}