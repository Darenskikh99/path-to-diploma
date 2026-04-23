import { Enemy } from './Enemy.js';

export class Teleportist extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.hp = 80;
        this.speed = 100;
        this.damage = 15;
        this.lastAttack = 0;
        this.lastTeleport = 0;
        this.setTint(0x33cccc);
        this.setScale(1.2);
    }

    update(time) {
        if (!this.target) return;
        
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        
        if (dist > 150) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
        } else {
            this.setVelocity(0, 0);
        }
        
        if (time > this.lastTeleport) {
            this.teleport();
            this.lastTeleport = time + 3000;
        }
        
        if (time > this.lastAttack) {
            this.rangedAttack();
            this.lastAttack = time + 1500;
        }
    }

    teleport() {
        this.scene.add.circle(this.x, this.y, 25, 0x33cccc, 0.5);
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 150;
        let newX = this.target.x + Math.cos(angle) * distance;
        let newY = this.target.y + Math.sin(angle) * distance;
        
        newX = Math.max(50, Math.min(750, newX));
        newY = Math.max(50, Math.min(550, newY));
        
        this.x = newX;
        this.y = newY;
        
        this.scene.add.circle(newX, newY, 25, 0x33cccc, 0.5);
    }

    rangedAttack() {
        const bullet = this.scene.add.sprite(this.x, this.y, 'player');
        bullet.setTint(0x33cccc);
        bullet.setScale(0.5);
        bullet.damage = this.damage;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const speed = 250;
        
        const interval = setInterval(() => {
            if (!bullet || !bullet.active || !this.target) {
                clearInterval(interval);
                return;
            }
            bullet.x += Math.cos(angle) * speed * 0.016;
            bullet.y += Math.sin(angle) * speed * 0.016;
            
            if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.target.x, this.target.y) < 30) {
                this.target.takeDamage(bullet.damage);
                bullet.destroy();
                clearInterval(interval);
            }
        }, 16);
        
        this.scene.time.delayedCall(3000, () => {
            clearInterval(interval);
            if (bullet && bullet.active) bullet.destroy();
        });
    }
}