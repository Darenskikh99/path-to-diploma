import { Player } from './entities/Player.js';
import { BOSS_MAX_HP } from './utils/constants.js';

export class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a0a2e');
        
        // Стены арены
        this.walls = this.physics.add.staticGroup();
        this.walls.create(16, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(784, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(400, 16, 'wall').setScale(25, 1).refreshBody();
        this.walls.create(400, 584, 'wall').setScale(25, 1).refreshBody();
        
        // Игрок
        this.player = new Player(this, 400, 500);
        this.physics.add.collider(this.player, this.walls);
        
        // Босс
        this.boss = this.physics.add.sprite(400, 150, 'enemy');
        this.boss.setScale(3);
        this.boss.setTint(0xaa00aa);
        this.boss.setImmovable(true);
        this.boss.hp = BOSS_MAX_HP;
        this.boss.maxHp = BOSS_MAX_HP;
        this.boss.phase = 1;
        this.boss.lastAttack = 0;
        
        this.physics.add.collider(this.boss, this.walls);
        this.physics.add.collider(this.player, this.boss, (p, b) => {
            if (this.time.now > b.lastAttack) {
                p.takeDamage(15);
                b.lastAttack = this.time.now + 500;
                const angle = Phaser.Math.Angle.Between(b.x, b.y, p.x, p.y);
                p.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);
            }
        });
        
        // UI
        this.add.text(400, 30, '🎓 DIPLOM - PHASE 1', { fontSize: '24px', color: '#ffdd00' }).setOrigin(0.5);
        this.phaseText = this.add.text(400, 60, '', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5);
        
        // Полоска здоровья босса
        this.createBossHealthBar();
        
        // Таймер атак
        this.time.addEvent({ delay: 2000, callback: this.bossAttack, callbackScope: this, loop: true });
        
        // ESC
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('HubScene'));
    }

    createBossHealthBar() {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '80px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.width = '400px';
        container.style.height = '24px';
        container.style.background = 'rgba(0,0,0,0.8)';
        container.style.border = '2px solid #aa00aa';
        container.style.borderRadius = '4px';
        container.style.zIndex = '100';
        
        this.bossHealthFill = document.createElement('div');
        this.bossHealthFill.style.width = '100%';
        this.bossHealthFill.style.height = '100%';
        this.bossHealthFill.style.background = 'linear-gradient(90deg, #8800aa, #ff44ff)';
        this.bossHealthFill.style.borderRadius = '2px';
        this.bossHealthFill.style.transition = 'width 0.1s';
        
        container.appendChild(this.bossHealthFill);
        document.getElementById('game-container').appendChild(container);
    }

    updateBossHealthBar() {
        if (this.bossHealthFill) {
            const percent = (this.boss.hp / this.boss.maxHp) * 100;
            this.bossHealthFill.style.width = Math.max(0, percent) + '%';
        }
    }

    bossAttack() {
        if (!this.boss || this.boss.hp <= 0) return;
        
        if (this.boss.phase === 1) {
            for (let i = 0; i < 3; i++) {
                this.shootProjectile(0, 200, 0xff00ff, true);
            }
        } else if (this.boss.phase === 2) {
            const baseAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
            const baseDeg = Phaser.Math.RadToDeg(baseAngle);
            for (let i = -2; i <= 2; i++) {
                this.shootProjectile(baseDeg + i * 25, 250, 0xff6600);
            }
        } else {
            for (let i = 0; i < 8; i++) {
                this.shootProjectile(i * 45, 280, 0xff0000);
            }
            this.time.delayedCall(500, () => {
                if (this.boss && this.boss.active) {
                    this.shootProjectile(0, 220, 0xff4444, true);
                    this.shootProjectile(0, 220, 0xff4444, true);
                }
            });
        }
    }

    shootProjectile(angleDeg, speed, color, targetPlayer = false) {
        let angle;
        
        if (targetPlayer && this.player) {
            angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        } else {
            angle = Phaser.Math.DegToRad(angleDeg);
        }
        
        const bullet = this.add.sprite(this.boss.x, this.boss.y, 'player');
        bullet.setTint(color);
        bullet.setScale(0.6);
        bullet.rotation = angle;
        bullet.damage = 10;
        
        const distance = 500;
        const targetX = this.boss.x + Math.cos(angle) * distance;
        const targetY = this.boss.y + Math.sin(angle) * distance;
        
        this.tweens.add({
            targets: bullet,
            x: targetX,
            y: targetY,
            duration: (distance / speed) * 1000,
            onUpdate: () => {
                if (!bullet || !bullet.active) return;
                
                if (this.player && this.player.active) {
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                    if (dist < 30) {
                        this.player.takeDamage(bullet.damage);
                        bullet.destroy();
                    }
                }
                
                if (this.walls) {
                    this.walls.getChildren().forEach(wall => {
                        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, wall.x, wall.y);
                        if (dist < 25) bullet.destroy();
                    });
                }
            },
            onComplete: () => {
                if (bullet && bullet.active) bullet.destroy();
            }
        });
    }

    hitBoss(bullet, boss) {
        bullet.destroy();
        boss.hp -= this.player.attackDamage;
        boss.setTint(0xff8888);
        this.time.delayedCall(100, () => boss.setTint(0xaa00aa));
        this.updateBossHealthBar();
        
        const hpPercent = boss.hp / boss.maxHp;
        
        if (hpPercent <= 0.66 && boss.phase === 1) {
            boss.phase = 2;
            this.add.text(400, 200, 'PHASE 2!', { fontSize: '48px', color: '#ff6600' }).setOrigin(0.5);
        } else if (hpPercent <= 0.33 && boss.phase === 2) {
            boss.phase = 3;
            this.add.text(400, 200, 'PHASE 3!', { fontSize: '48px', color: '#ff0000' }).setOrigin(0.5);
        }
        
        if (boss.hp <= 0) {
            boss.destroy();
            this.add.text(400, 300, '🎉 VICTORY! 🎉', { fontSize: '48px', color: '#ffdd00' }).setOrigin(0.5);
            this.time.delayedCall(3000, () => this.scene.start('HubScene'));
        }
    }

    update(time) {
        if (this.player) this.player.update(time, this.input.activePointer);
    }

    shutdown() {
        const containers = document.querySelectorAll('#game-container div');
        containers.forEach(c => c.remove());
    }
}