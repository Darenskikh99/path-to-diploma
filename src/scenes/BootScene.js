import { COLORS } from '../utils/constants.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const g = this.make.graphics({ add: false });
        g.fillStyle(COLORS.PLAYER, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x2266cc, 1);
        g.fillCircle(16, 16, 6);
        g.generateTexture('player', 32, 32);
        
        const w = this.make.graphics({ add: false });
        w.fillStyle(COLORS.WALL, 1);
        w.fillRect(0, 0, 32, 32);
        w.lineStyle(2, 0x444444);
        w.strokeRect(1, 1, 30, 30);
        w.generateTexture('wall', 32, 32);
        
        const e = this.make.graphics({ add: false });
        e.fillStyle(COLORS.ENEMY, 1);
        e.fillRect(0, 0, 32, 32);
        e.fillStyle(0x000000);
        e.fillRect(8, 8, 6, 6);
        e.fillRect(18, 8, 6, 6);
        e.generateTexture('enemy', 32, 32);
        
        const d = this.make.graphics({ add: false });
        d.fillStyle(COLORS.DOOR, 1);
        d.fillRect(0, 0, 32, 64);
        d.fillStyle(0xFFD700);
        d.fillCircle(24, 32, 4);
        d.generateTexture('door', 32, 64);
    }

    create() {
        this.scene.start('HubScene');
    }
}