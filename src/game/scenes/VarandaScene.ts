import { Scene, GameObjects, Physics, Input } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { DialogBox } from '../components/DialogBox';
import { BaseScene } from './BaseScene';
import { InteractionPoint } from '../controllers/InteractionController';

export default class VarandaScene extends BaseScene {
    private gbEffect!: GBEffect;
    private mapLayersCache: {
        groundLayer: Phaser.Tilemaps.TilemapLayer | undefined;
        wallsLayer: Phaser.Tilemaps.TilemapLayer | undefined;
        objetosLayer: Phaser.Tilemaps.TilemapLayer | undefined;
        plantasLayer: Phaser.Tilemaps.TilemapLayer | undefined;
    } = {
        groundLayer: undefined,
        wallsLayer: undefined,
        objetosLayer: undefined,
        plantasLayer: undefined
    };

    constructor() {
        super({ key: 'VarandaScene' });
    }

    preload(): void {
        const publicUrl = process.env.PUBLIC_URL || '';
        console.log('Carregando assets...');
        console.log('Tentando carregar mapa:', `${publicUrl}/assets/varanda.json`);
        this.load.tilemapTiledJSON('varanda', `${publicUrl}/assets/varanda.json`);
        console.log('Tentando carregar tileset:', `${publicUrl}/assets/Interior general.png`);
        this.load.image('Interior general', `${publicUrl}/assets/Interior general.png`);
        console.log('Tentando carregar spritesheet do player:', `${publicUrl}/assets/heric2.png`);
        this.load.spritesheet('player', `${publicUrl}/assets/heric2.png`, { frameWidth: 16, frameHeight: 16 });
        this.load.image('player_portrait', `${publicUrl}/assets/heric2.png`);
    }

    create(): void {
        super.create();
        
        console.log('Iniciando criação da cena...');
        
        this.setupPixelPerfectRendering();
        this.initializeGBEffect();
        
        const map = this.make.tilemap({ key: 'varanda' });
        const tileset = map.addTilesetImage('Interior general', 'Interior general', 16, 16, 0, 0);
        
        if (!tileset) {
            console.error('Erro ao carregar tileset - tileset é null');
            return;
        }

        this.createMapLayers(map, tileset);
        this.setupPlayerFromMap(map);
        this.setupInteractions();
        this.setupCamera(map.widthInPixels, map.heightInPixels);
        this.setupCollisions([
            this.mapLayersCache.groundLayer,
            this.mapLayersCache.wallsLayer,
            this.mapLayersCache.objetosLayer,
            this.mapLayersCache.plantasLayer
        ].filter((layer): layer is Phaser.Tilemaps.TilemapLayer => layer !== undefined));
        
        console.log('Cena criada com sucesso!');
    }

    private setupPixelPerfectRendering(): void {
        this.textures.get('player').setFilter(Phaser.Textures.FilterMode.NEAREST);
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
        const groundLayer = map.createLayer('ground', tileset);
        const wallsLayer = map.createLayer('walls', tileset);
        const objetosLayer = map.createLayer('objetos', tileset);
        const plantasLayer = map.createLayer('plantas', tileset);

        this.mapLayersCache = {
            groundLayer: groundLayer || undefined,
            wallsLayer: wallsLayer || undefined,
            objetosLayer: objetosLayer || undefined,
            plantasLayer: plantasLayer || undefined
        };

        if (!this.mapLayersCache.groundLayer || !this.mapLayersCache.wallsLayer || 
            !this.mapLayersCache.objetosLayer || !this.mapLayersCache.plantasLayer) {
            console.error('Erro ao criar camadas do mapa');
            return;
        }

        // Configurar colisões
        this.mapLayersCache.wallsLayer.setCollisionByProperty({ collides: true });
        this.mapLayersCache.objetosLayer.setCollisionByExclusion([-1]);
        this.mapLayersCache.plantasLayer.setCollisionByExclusion([-1]);

        // Tornar as camadas de colisão visíveis para debug (opcional)
        const debugGraphics = this.add.graphics().setAlpha(0.75);
        this.mapLayersCache.wallsLayer.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
            faceColor: new Phaser.Display.Color(40, 39, 37, 255)
        });
    }

    private setupPlayerFromMap(map: Phaser.Tilemaps.Tilemap): void {
        this.setupPlayer({
            startX: 32,
            startY: map.heightInPixels / 2,
            spriteKey: 'player',
            clearance: 'employee'
        });
    }

    protected setupInteractions(): void {
        const map = this.make.tilemap({ key: 'varanda' });
        
        // Configurar interações do telescópio
        const telescopioLayer = map.getObjectLayer('telescopio');
        if (telescopioLayer) {
            const telescopioPoints: InteractionPoint[] = telescopioLayer.objects.map(obj => ({
                x: obj.x || 0,
                y: obj.y || 0,
                radius: 50,
                type: 'telescopio',
                dialog: 'Um telescópio antigo. Você olha através dele e vê o horizonte de Santos...'
            }));
            this.interactionController.addInteractionPoints(telescopioPoints);
        }

        // Configurar interações dos vasos
        const vasoLayer = map.getObjectLayer('vaso');
        if (vasoLayer) {
            const vasoPoints: InteractionPoint[] = vasoLayer.objects.map(obj => ({
                x: obj.x || 0,
                y: obj.y || 0,
                radius: 50,
                type: 'vaso',
                dialog: 'Um vaso bonito com uma planta exótica. Parece ser uma espécie rara.'
            }));
            this.interactionController.addInteractionPoints(vasoPoints);
        }

        // Configurar interações do computador
        const computadorLayer = map.getObjectLayer('computador');
        if (computadorLayer) {
            const computadorPoints: InteractionPoint[] = computadorLayer.objects.map(obj => ({
                x: obj.x || 0,
                y: obj.y || 0,
                radius: 50,
                type: 'computador',
                dialog: 'Um computador antigo. Parece que ainda funciona.'
            }));
            this.interactionController.addInteractionPoints(computadorPoints);
        }

        // Configurar outras interações gerais
        const interactionLayer = map.getObjectLayer('interactions');
        if (interactionLayer) {
            const interactionPoints: InteractionPoint[] = interactionLayer.objects.map(obj => ({
                x: obj.x || 0,
                y: obj.y || 0,
                radius: 50,
                dialog: obj.properties?.find((p: { name: string; value: string }) => p.name === 'dialog')?.value || '',
                type: obj.properties?.find((p: { name: string; value: string }) => p.name === 'type')?.value || 'thought'
            }));
            this.interactionController.addInteractionPoints(interactionPoints);
        }
    }

    update(): void {
        super.update();

        const player = this.playerController.getPlayer();
        if (!player?.sprite) return;

        if (player.sprite.x <= -16) {
            console.log('Jogador saiu pela esquerda, voltando para GameScene...');
            player.sprite.setVelocity(0, 0);
            this.scene.start('GameScene', { fromRight: true });
            return;
        }
    }
} 