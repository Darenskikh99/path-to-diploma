import { COLORS } from '../utils/constants.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Игрок (спрайт-лист)
        this.load.spritesheet('player', 'assets/sprites/player.png', {
            frameWidth: 128,
            frameHeight: 160
        });
        
        // Враги (пока квадратики, потом заменишь)
        this.createEnemyTexture();
        
        // Стены и двери
        this.createWallTexture();
        this.createDoorTexture();
    }

    createEnemyTexture() {
        const e = this.make.graphics({ add: false });
        e.fillStyle(0xcc3333);
        e.fillRect(0, 0, 32, 32);
        e.generateTexture('enemy', 32, 32);
        
        const l = this.make.graphics({ add: false });
        l.fillStyle(0x6633cc);
        l.fillRect(0, 0, 32, 32);
        l.generateTexture('lector', 32, 32);
        
        const t = this.make.graphics({ add: false });
        t.fillStyle(0x33cccc);
        t.fillRect(0, 0, 32, 32);
        t.generateTexture('teleportist', 32, 32);
        
        const s = this.make.graphics({ add: false });
        s.fillStyle(0xff4444);
        s.fillRect(0, 0, 48, 48);
        s.generateTexture('sessiya', 48, 48);
    }

    createWallTexture() {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x888888);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x666666);
        g.fillRect(1, 1, 14, 14);
        g.fillRect(17, 1, 14, 14);
        g.fillRect(1, 17, 14, 14);
        g.fillRect(17, 17, 14, 14);
        g.generateTexture('wall', 32, 32);
    }

    createDoorTexture() {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x8B4513);
        g.fillRect(4, 0, 24, 64);
        g.fillStyle(0xFFD700);
        g.fillCircle(24, 30, 4);
        g.generateTexture('door', 32, 64);
    }

    create() {
        // Анимации игрока
        this.anims.create({
            key: 'player_idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 6 }),
            frameRate: 6,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player_walk',
            frames: this.anims.generateFrameNumbers('player', { start: 7, end: 14 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player_run',
            frames: this.anims.generateFrameNumbers('player', { start: 15, end: 22 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player_hurt',
            frames: this.anims.generateFrameNumbers('player', { start: 23, end: 30 }),
            frameRate: 8,
            repeat: 0
        });
        
        this.anims.create({
            key: 'player_attack',
            frames: this.anims.generateFrameNumbers('player', { start: 31, end: 38 }),
            frameRate: 12,
            repeat: 0
        });
        
        this.anims.create({
            key: 'player_death',
            frames: this.anims.generateFrameNumbers('player', { start: 39, end: 45 }),
            frameRate: 6,
            repeat: 0
        });
        
        this.scene.start('HubScene');
    }
}