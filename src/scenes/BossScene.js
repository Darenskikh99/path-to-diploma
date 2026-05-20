import { Player } from '../entities/Player.js';

export class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a0a2e');
        
        // Стены
        this.walls = this.physics.add.staticGroup();
        this.walls.create(16, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(784, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(400, 16, 'wall').setScale(25, 1).refreshBody();
        this.walls.create(400, 584, 'wall').setScale(25, 1).refreshBody();
        
        // Игрок
        this.player = new Player(this, 400, 500, 'ranged');
        this.physics.add.collider(this.player, this.walls);
        
        // Босс
        this.boss = this.physics.add.sprite(400, 150, 'enemy');
        this.boss.setScale(3);
        this.boss.setTint(0xaa00aa);
        this.boss.setImmovable(true);
        this.boss.hp = 500;
        this.boss.maxHp = 500;
        this.boss.phase = 1;
        this.boss.lastAttack = 0;
        this.boss.body.setSize(60, 60);
        
        this.physics.add.collider(this.boss, this.walls);
        this.physics.add.collider(this.player, this.boss, (p, b) => {
            if (this.time.now > b.lastAttack) {
                p.takeDamage(15);
                b.lastAttack = this.time.now + 500;
            }
        });
        
        // UI
        this.add.text(400, 30, '🎓 DIPLOM - PHASE 1', { fontSize: '24px', color: '#ffdd00' }).setOrigin(0.5);
        this.createBossHealthBar();
        
        // Таймер атак босса
        this.time.addEvent({ 
            delay: 2000, 
            callback: this.bossAttack, 
            callbackScope: this, 
            loop: true 
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.clearUI();
            this.scene.start('HubScene');
            this.scene.start('HubScene');
        });
    }

    createBossHealthBar() {
        const c = document.createElement('div');
        c.style.cssText = 'position:absolute;top:80px;left:50%;transform:translateX(-50%);width:400px;height:24px;background:rgba(0,0,0,0.8);border:2px solid #aa00aa;border-radius:4px;z-index:100';
        this.bossHealthFill = document.createElement('div');
        this.bossHealthFill.style.cssText = 'width:100%;height:100%;background:linear-gradient(90deg,#8800aa,#ff44ff);border-radius:2px;transition:width 0.1s';
        c.appendChild(this.bossHealthFill);
        document.getElementById('game-container').appendChild(c);
    }

    updateBossHealthBar() {
        if (this.bossHealthFill && this.boss) {
            this.bossHealthFill.style.width = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100) + '%';
        }
    }

    bossAttack() {
        if (!this.boss || !this.boss.active || !this.player) return;
        
        if (this.boss.phase === 1) {
            this.sound.play('boss_shoot');
            for (let i = 0; i < 3; i++) {
                this.shootProjectile(0, 200, 0xff00ff, true);
            }
        } else if (this.boss.phase === 2) {
            this.sound.play('boss_shoot2');
            const baseAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
            for (let i = -2; i <= 2; i++) {
                this.shootProjectile(baseAngle + i * 0.3, 250, 0xff6600);
            }
        } else {
            this.sound.play('boss_shoot3');
            for (let i = 0; i < 8; i++) {
                this.shootProjectile(i * Math.PI / 4, 280, 0xff0000);
            }
        }
    }

    shootProjectile(angleOrDeg, speed, color, useDeg = false) {
        if (!this.boss) return;
        
        let angle;
        if (useDeg && this.player) {
            angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        } else {
            angle = typeof angleOrDeg === 'number' ? angleOrDeg : Phaser.Math.DegToRad(angleOrDeg);
        }
        
        const bullet = this.add.text(this.boss.x, this.boss.y, 'НЕУД', {
            fontSize: '28px',
            color: '#ff00ff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        bullet.setData('isBossBullet', true);
        
        const tx = this.boss.x + Math.cos(angle) * 500;
        const ty = this.boss.y + Math.sin(angle) * 500;
        
        this.tweens.add({
            targets: bullet,
            x: tx, y: ty,
            duration: (500 / speed) * 1000,
            onUpdate: () => {
                if (!bullet || !bullet.active || !this.player) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                if (dist < 30) {
                    this.player.takeDamage(10);
                    bullet.destroy();
                }
            },
            onComplete: () => {
                if (bullet && bullet.active) bullet.destroy();
            }
        });
    }

    update(time) {
        if (this.player) {
            this.player.update(time, this.input.activePointer);
        }
        
        if (this.boss && this.boss.active && this.player) {
            this.children.list.forEach(child => {
                if (child && child.active && 
                    child !== this.boss && 
                    child !== this.player &&
                    child.type === 'Sprite' &&
                    (child.scaleX <= 0.6 || child.type === 'Text') &&
                    !child.getData('isBossBullet')) {
                    
                    const dist = Phaser.Math.Distance.Between(child.x, child.y, this.boss.x, this.boss.y);
                    if (dist < 60) {
                        const damage = this.player.weapon ? this.player.weapon.damage : 30;
                        child.destroy();
                        this.damageBoss(damage);
                    }
                }
            });
        }
    }

    damageBoss(damage) {
        if (!this.boss || this.boss.hp <= 0) return;
        
        this.boss.hp -= damage;
        this.boss.setTint(0xff8888);
        this.time.delayedCall(100, () => {
            if (this.boss) this.boss.setTint(0xaa00aa);
        });
        this.updateBossHealthBar();
        
        const hpPercent = this.boss.hp / this.boss.maxHp;
        
        if (hpPercent <= 0.66 && this.boss.phase === 1) {
            this.boss.phase = 2;
            this.add.text(400, 200, 'PHASE 2!', { fontSize: '48px', color: '#ff6600' }).setOrigin(0.5);
        } else if (hpPercent <= 0.33 && this.boss.phase === 2) {
            this.boss.phase = 3;
            this.add.text(400, 200, 'PHASE 3!', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
        }
        
        if (this.boss.hp <= 0) {
            this.sound.play('enemy_death');
            this.boss.destroy();
            this.boss = null;
            this.time.removeAllEvents();
            this.add.text(400, 300, '🎉 VICTORY! 🎉', { fontSize: '48px', color: '#ffdd00' }).setOrigin(0.5);
            this.time.delayedCall(3000, () => {
                this.clearUI();
                this.scene.start('HubScene');
            });
        }
    }

    hitBoss(source, boss) {
        const damage = source.damage || 30;
        if (source.destroy) source.destroy();
        this.damageBoss(damage);
    }

    clearUI() {
        const containers = document.querySelectorAll('#game-container div');
        containers.forEach(c => c.remove());
        const indicator = document.querySelector('.weapon-indicator');
        if (indicator) indicator.remove();
    }
}