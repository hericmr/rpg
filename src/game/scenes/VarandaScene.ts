import { Scene, GameObjects, Physics, Input } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { DialogBox } from '../components/DialogBox';
import { BaseScene, Player } from './BaseScene';

export default class VarandaScene extends BaseScene {
  protected player!: Player;
  protected cursors: {
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
    shift?: Phaser.Input.Keyboard.Key;
  } = {};
  protected readonly NORMAL_SPEED = 100;
  protected readonly SPRINT_SPEED = 200;
  protected dialogActive: boolean = false;
  protected interactionPoints?: { x: number; y: number; dialog: string }[];
  protected currentDialog?: DialogBox;

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
    console.log('Iniciando criação da cena...');
    
    // Configurar renderização pixel perfect
    this.textures.get('player').setFilter(Phaser.Textures.FilterMode.NEAREST);
    
    // Carregar o mapa
    console.log('Criando tilemap...');
    const map = this.make.tilemap({ key: 'varanda' });
    console.log('Tilemap criado:', map);
    
    // Adicionar o tileset
    console.log('Adicionando tileset...');
    const tileset = map.addTilesetImage('Interior general', 'Interior general', 16, 16, 0, 0);
    console.log('Tileset adicionado:', tileset);
    
    if (!tileset) {
      console.error('Erro ao carregar tileset - tileset é null');
      return;
    }

    // Criar as camadas
    console.log('Criando camadas...');
    const groundLayer = map.createLayer('ground', tileset);
    const wallsLayer = map.createLayer('walls', tileset);
    const objetosLayer = map.createLayer('objetos', tileset);
    const plantasLayer = map.createLayer('plantas', tileset);

    if (!groundLayer || !wallsLayer || !objetosLayer || !plantasLayer) {
      console.error('Erro ao criar camadas do mapa');
      return;
    }

    // Criar o jogador na posição inicial
    this.setupPlayer(32, map.heightInPixels / 2);
    
    // Configurar a câmera
    this.setupCamera(map.widthInPixels, map.heightInPixels);
    
    // Configurar colisões
    this.setupCollisions([wallsLayer, objetosLayer, plantasLayer]);
    
    // Configurar interações
    this.setupInteractions(map);
    
    // Configurar controles
    this.setupInput();
    
    // Configurar animações
    this.setupAnimations();
    
    console.log('Cena criada com sucesso!');
  }

  private setupCollisions(layers: Phaser.Tilemaps.TilemapLayer[]): void {
    layers.forEach(layer => {
      if (layer) {
        const layerHasCollision = layer.layer.properties?.some(
          (prop: any) => prop.name === 'collides' && prop.value === true
        );
        if (layerHasCollision) {
          layer.setCollisionBetween(0, 9999, true);
          this.physics.add.collider(this.player.sprite, layer);
        } else {
          layer.setCollisionByProperty({ collides: true });
          this.physics.add.collider(this.player.sprite, layer);
        }
      }
    });
  }

  private setupInteractions(map: Phaser.Tilemaps.Tilemap): void {
    const interactionLayer = map.getObjectLayer('interactions');
    if (interactionLayer) {
      this.interactionPoints = interactionLayer.objects.map(obj => ({
        x: obj.x || 0,
        y: obj.y || 0,
        dialog: obj.properties?.find((p: { name: string; value: string }) => p.name === 'dialog')?.value || ''
      }));
    }
  }

  private setupAnimations(): void {
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1
    });
  }

  protected setupPlayer(x: number, y: number): void {
    const sprite = this.physics.add.sprite(x, y, 'player');
    sprite.setSize(12, 12);
    sprite.setOffset(2, 2);
    sprite.setScale(2);

    this.player = {
      sprite,
      inventory: [],
      stats: {
        clearance: "Branco",
        implants: []
      }
    };
  }

  update(): void {
    if (!this.player) return;

    // Verificar se o jogador saiu pela esquerda
    if (this.player.sprite.x <= -16) {
      console.log('Jogador saiu pela esquerda, voltando para GameScene...');
      this.player.sprite.setVelocity(0, 0);
      this.scene.start('GameScene', { fromRight: true });
      return;
    }

    this.handleMovement();
    this.checkInteractions();
  }

  protected handleMovement(): void {
    if (!this.player?.sprite || this.dialogActive) return;

    const speed = this.cursors.shift?.isDown ? this.SPRINT_SPEED : this.NORMAL_SPEED;
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
    if (!this.input.keyboard || !this.interactionPoints) return;
    
    const spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    if (spaceKey.isDown) {
      console.log('Space key pressed');
      this.checkInteractionPoints();
    }
  }

  protected checkInteractionPoints(): void {
    if (!this.interactionPoints || !this.player?.sprite) {
      console.log('No interaction points found');
      return;
    }

    const playerBounds = this.player.sprite.getBounds();
    const interactionDistance = 50;

    for (const point of this.interactionPoints) {
      const distance = Phaser.Math.Distance.Between(
        playerBounds.centerX,
        playerBounds.centerY,
        point.x,
        point.y
      );

      console.log('Distance to interaction point:', distance);

      if (distance <= interactionDistance) {
        console.log('Showing dialog for point:', point);
        this.showDialog(point.dialog);
        break;
      }
    }
  }

  protected showDialog(dialog: string): void {
    this.dialogActive = true;
    this.player.sprite.setVelocity(0, 0);

    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const x = screenWidth / 2;
    const y = screenHeight - (screenHeight * 0.15);

    this.currentDialog = new DialogBox({
      scene: this,
      x: x,
      y: y,
      width: screenWidth * 0.9,
      height: screenHeight * 0.3,
      dialog: dialog,
      portrait: 'player_portrait',
      name: dialog,
      dialogColor: 0x1a237e,
      textColor: '#FFFFFF',
      onClose: () => {
        this.dialogActive = false;
      }
    });
  }

  private closeDialog(
    background: GameObjects.Rectangle,
    text: GameObjects.Text,
    innerBorder: GameObjects.Rectangle,
    outerBorder: GameObjects.Rectangle,
    nameText: GameObjects.Text
  ): void {
    if (this.currentDialog) {
      this.currentDialog.close();
      this.currentDialog = undefined;
    }
    this.dialogActive = false;
  }
} 