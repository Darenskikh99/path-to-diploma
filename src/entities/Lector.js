import { Enemy } from './Enemy.js';

export class Lector extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.hp = 120;
        this.speed = 50;
        this.damage = 20;
        this.lastAttack = 0;
        this.lastSummon = 0;
        this.setTint(0x6633cc);
        this.setScale(1.5);
    }

    update(time) {
        if (!this.target) return;
        
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        
        if (dist > 200) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
        } else {
            this.setVelocity(0, 0);
        }
        
        if (time > this.lastAttack) {
            this.rangedAttack();
            this.lastAttack = time + 1500;
        }
        
        if (time > this.lastSummon) {
            this.summonMinions();
            this.lastSummon = time + 5000;
        }
    }

    rangedAttack() {
        const bullet = this.scene.add.sprite(this.x, this.y, 'player');
        bullet.setTint(0x6633cc);
        bullet.setScale(0.6);
        bullet.damage = this.damage;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const speed = 200;
        
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

    summonMinions() {
        for (let i = 0; i < 2; i++) {
            const offsetX = (i === 0 ? -50 : 50);
            const minion = new Enemy(this.scene, this.x + offsetX, this.y + 30);
            minion.setTarget(this.target);
            minion.setTint(0xff6666);
            if (this.scene.enemies) this.scene.enemies.add(minion);
        }
    }
}