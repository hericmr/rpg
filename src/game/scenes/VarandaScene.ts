import { Scene, GameObjects, Physics, Input } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';
import { DialogBox } from '../components/DialogBox';

export default class VarandaScene extends Scene {
  private player!: Physics.Arcade.Sprite;
  private cursors: {
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
    shift?: Phaser.Input.Keyboard.Key;
  } = {};
  private readonly NORMAL_SPEED = 100;
  private readonly SPRINT_SPEED = 200;
  private dialogActive: boolean = false;
  private interactionPoints?: { x: number; y: number; dialog: string }[];
  private currentDialog?: DialogBox;

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
    // Carregar o retrato do jogador
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
    console.log('Camada ground criada:', groundLayer);
    const wallsLayer = map.createLayer('walls', tileset);
    console.log('Camada walls criada:', wallsLayer);
    const objetosLayer = map.createLayer('objetos', tileset);
    console.log('Camada objetos criada:', objetosLayer);
    const plantasLayer = map.createLayer('plantas', tileset);
    console.log('Camada plantas criada:', plantasLayer);

    if (!groundLayer || !wallsLayer || !objetosLayer || !plantasLayer) {
      console.error('Erro ao criar camadas do mapa:', {
        ground: !!groundLayer,
        walls: !!wallsLayer,
        objetos: !!objetosLayer,
        plantas: !!plantasLayer
      });
      return;
    }

    // Criar o jogador na posição inicial (lado esquerdo do mapa)
    console.log('Criando jogador...');
    this.player = this.physics.add.sprite(32, map.heightInPixels / 2, 'player');
    console.log('Jogador criado:', this.player);
    
    // Configurar o jogador
    this.player.setScale(2);
    this.player.setSize(12, 12);
    this.player.setOffset(2, 2);
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(1);
    
    // Adicionar animações do jogador
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

    // Configurar a câmera
    console.log('Configurando câmera...');
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1); // Aumentando o zoom para 4x
    this.cameras.main.setRoundPixels(true);

    // Configurar colisões para todas as camadas
    console.log('Configurando colisões...');
    const collidableLayers = [wallsLayer, objetosLayer, plantasLayer];
    collidableLayers.forEach(layer => {
      if (layer) {
        // Verifica se a camada tem a propriedade collides: true
        const layerHasCollision = layer.layer.properties?.some(
          (prop: any) => prop.name === 'collides' && prop.value === true
        );
        if (layerHasCollision) {
          // Ativa colisão para todos os tiles da camada
          layer.setCollisionBetween(0, 9999, true);
          this.physics.add.collider(this.player, layer);
          console.log(`Colisão ativada para a camada ${layer.layer.name} por propriedade da camada.`);
        } else {
          // Mantém a colisão por propriedade de tile também
          layer.setCollisionByProperty({ collides: true });
          this.physics.add.collider(this.player, layer);
        }
      }
    });
    
    // Carregar a camada de interação
    const interactionLayer = map.getObjectLayer('interactions');
    console.log('Interaction layer:', interactionLayer);
    
    if (interactionLayer) {
      this.interactionPoints = interactionLayer.objects.map(obj => {
        console.log('Interaction object:', obj);
        return {
          x: obj.x || 0,
          y: obj.y || 0,
          dialog: obj.properties?.find((p: { name: string; value: string }) => p.name === 'dialog')?.value || ''
        };
      });
      console.log('Interaction points:', this.interactionPoints);
    }

    // Configurar controles
    console.log('Configurando controles...');
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.addKeys({
        left: Input.Keyboard.KeyCodes.LEFT,
        right: Input.Keyboard.KeyCodes.RIGHT,
        up: Input.Keyboard.KeyCodes.UP,
        down: Input.Keyboard.KeyCodes.DOWN,
        shift: Input.Keyboard.KeyCodes.SHIFT
      });
    }
    
    console.log('Cena criada com sucesso!');
  }

  update(): void {
    if (!this.player) return;

    if (this.dialogActive) return;

    // Movimento horizontal
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-100);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(100);
    } else {
      this.player.setVelocityX(0);
    }

    // Movimento vertical
    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-100);
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(100);
    } else {
      this.player.setVelocityY(0);
    }

    // Verificar interações
    this.checkInteractions();

    // Verificar se o jogador saiu pela esquerda
    if (this.player.x <= -16) {
      console.log('Jogador saiu pela esquerda, voltando para GameScene...');
      this.player.setVelocity(0, 0);
      this.scene.start('GameScene', { fromRight: true });
    }
  }

  private checkInteractions(): void {
    if (!this.input.keyboard || !this.interactionPoints) return;
    
    const spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    if (spaceKey.isDown) {
      console.log('Space key pressed');
      this.checkInteractionPoints();
    }
  }

  private checkInteractionPoints(): void {
    if (!this.interactionPoints) {
      console.log('No interaction points found');
      return;
    }

    const playerBounds = this.player.getBounds();
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

  private showDialog(dialog: string): void {
    this.dialogActive = true;
    this.player.setVelocity(0, 0);

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
      name: 'Você',
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