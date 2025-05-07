import { Scene, GameObjects, Physics, Input } from 'phaser';
import { GBPipeline } from '../effects/GBPipeline';
import { GBEffect } from '../effects/GBEffect';

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

    if (!groundLayer || !wallsLayer || !objetosLayer) {
      console.error('Erro ao criar camadas do mapa:', {
        ground: !!groundLayer,
        walls: !!wallsLayer,
        objetos: !!objetosLayer
      });
      return;
    }

    // Configurar colisões
    console.log('Configurando colisões...');
    wallsLayer.setCollisionBetween(0, 1000, true);
    objetosLayer.setCollisionBetween(0, 1000, true);

    // Criar o jogador na posição inicial (lado esquerdo do mapa)
    console.log('Criando jogador...');
    this.player = this.physics.add.sprite(32, map.heightInPixels / 2, 'player');
    console.log('Jogador criado:', this.player);
    
    // Configurar o jogador
    this.player.setScale(2);
    this.player.setSize(24, 24);
    this.player.setOffset(4, 4);
    this.player.setCollideWorldBounds(false); // Permitir que o jogador saia dos limites do mapa
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

    // Configurar colisões
    console.log('Configurando colisões do jogador...');
    this.physics.add.collider(this.player, wallsLayer);
    this.physics.add.collider(this.player, objetosLayer);
    
    console.log('Cena criada com sucesso!');
  }

  update(): void {
    if (!this.player) return;

    const currentSpeed = this.cursors.shift?.isDown ? this.SPRINT_SPEED : this.NORMAL_SPEED;

    // Movimento horizontal
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-currentSpeed);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(currentSpeed);
    } else {
      this.player.setVelocityX(0);
    }

    // Movimento vertical
    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-currentSpeed);
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(currentSpeed);
    } else {
      this.player.setVelocityY(0);
    }

    // Verificar se o jogador saiu pela esquerda
    if (this.player.x <= -16) { // Aumentando a área de detecção
      console.log('Jogador saiu pela esquerda, voltando para GameScene...');
      this.player.setVelocity(0, 0);
      this.scene.start('GameScene', { fromRight: true });
    }
  }
} 