import { Enemy } from './Enemy.js';

export class Sessiya extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.hp = 250;
        this.maxHp = 250;
        this.speed = 80;
        this.damage = 25;
        this.lastAttack = 0;
        this.lastSummon = 0;
        this.phase = 1;
        this.setTint(0xff4444);
        this.setScale(2.0);
    }

    update(time) {
        if (!this.target) return;
        
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        
        if (this.phase === 1) {
            this.scene.physics.moveToObject(this, this.target, this.speed * 1.3);
            if (time > this.lastAttack && dist < 200) {
                this.attackPhase1();
                this.lastAttack = time + 1200;
            }
        } else {
            if (dist > 250) {
                this.scene.physics.moveToObject(this, this.target, this.speed);
            } else if (dist < 150) {
                const angle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
                this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
            } else {
                this.setVelocity(0, 0);
            }
            if (time > this.lastAttack) {
                this.attackPhase2();
                this.lastAttack = time + 1000;
            }
        }
        
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        
        if (time > this.lastSummon) {
            this.summonMinions();
            this.lastSummon = time + 4000;
        }
    }

    attackPhase1() {
        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        for (let i = -1; i <= 1; i++) {
            this.shootBullet(baseAngle + i * 0.3, 250, 0xff6666);
        }
    }

    attackPhase2() {
        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        for (let i = -2; i <= 2; i++) {
            this.shootBullet(baseAngle + i * 0.2, 280, 0xff3333);
        }
    }

    shootBullet(angle, speed, color) {
        const bullet = this.scene.add.sprite(this.x, this.y, 'player');
        bullet.setTint(color);
        bullet.setScale(0.5);
        bullet.damage = this.damage;
        
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
        const count = this.phase === 1 ? 2 : 3;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * 60;
            const y = this.y + Math.sin(angle) * 60;
            const minion = new Enemy(this.scene, x, y);
            minion.setTarget(this.target);
            minion.setTint(0xff8888);
            if (this.scene.enemies) this.scene.enemies.add(minion);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.setTint(0xff8888);
        this.scene.time.delayedCall(100, () => {
            if (this.active) this.setTint(0xff4444);
        });
        
        if (this.hp <= this.maxHp / 2 && this.phase === 1) {
            this.phase = 2;
            this.scene.add.text(400, 200, 'PHASE 2!', { fontSize: '40px', color: '#ff0000' }).setOrigin(0.5);
            this.setTint(0xff0000);
        }
        
        if (this.hp <= 0) {
            this.scene.add.text(400, 300, 'SESSIYA DEFEATED!', { fontSize: '32px', color: '#44ff44' }).setOrigin(0.5);
            this.destroy();
        }
    }
}