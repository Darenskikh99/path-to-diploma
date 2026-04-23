import { PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_DASH_COOLDOWN, PLAYER_DASH_DURATION, PLAYER_DASH_SPEED } from '../utils/constants.js';
import { WEAPONS } from '../data/weapons.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, weaponType = 'RANGED') {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speed = PLAYER_SPEED;
        this.hp = PLAYER_MAX_HP;
        this.maxHp = PLAYER_MAX_HP;
        
        this.setWeapon(weaponType);
        
        this.isDashing = false;
        this.dashCooldown = PLAYER_DASH_COOLDOWN;
        this.lastDash = 0;
        this.dashSpeed = PLAYER_DASH_SPEED;
        this.lastAttack = 0;
        
        this.setCollideWorldBounds(true);
        this.setSize(28, 28);
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D', dash: 'SPACE'
        });
        
        this.showWeaponIndicator();
    }

    setWeapon(type) {
        if (type === 'fast_melee') this.weapon = WEAPONS.FAST_MELEE;
        else if (type === 'slow_melee') this.weapon = WEAPONS.SLOW_MELEE;
        else this.weapon = WEAPONS.RANGED;
    }

    showWeaponIndicator() {
        const old = document.querySelector('.weapon-indicator');
        if (old) old.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'weapon-indicator';
        indicator.style.cssText = `
            position: absolute; bottom: 60px; right: 20px;
            padding: 8px 16px; background: rgba(0,0,0,0.7);
            color: #fff; border-radius: 8px; font-size: 16px;
            font-weight: bold; border: 2px solid ${'#' + this.weapon.color.toString(16).padStart(6, '0')};
            z-index: 100;
        `;
        indicator.textContent = `${this.weapon.name} | ${this.weapon.damage} DMG`;
        document.getElementById('game-container').appendChild(indicator);
    }

    update(time, pointer) {
        if (this.isDashing) return;
        
        this.setVelocity(0);
        if (this.cursors.left.isDown || this.wasd.left.isDown) this.setVelocityX(-this.speed);
        if (this.cursors.right.isDown || this.wasd.right.isDown) this.setVelocityX(this.speed);
        if (this.cursors.up.isDown || this.wasd.up.isDown) this.setVelocityY(-this.speed);
        if (this.cursors.down.isDown || this.wasd.down.isDown) this.setVelocityY(this.speed);
        
        if (pointer.worldX) {
            this.rotation = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd.dash) && time > this.lastDash) {
            this.isDashing = true;
            this.lastDash = time + this.dashCooldown;
            this.setVelocity(Math.cos(this.rotation) * this.dashSpeed, Math.sin(this.rotation) * this.dashSpeed);
            this.setAlpha(0.6);
            this.body.checkCollision.none = true;
            this.scene.time.delayedCall(PLAYER_DASH_DURATION, () => {
                this.isDashing = false;
                this.setAlpha(1);
                this.body.checkCollision.none = false;
            });
        }
        
        if (pointer.leftButtonDown() && time > this.lastAttack) {
            this.attack(pointer);
            this.lastAttack = time + this.weapon.cooldown;
        }
    }

    attack(pointer) {
        if (this.weapon.type === 'ranged') {
            this.rangedAttack(pointer);
        } else {
            this.meleeAttack();
        }
    }

    meleeAttack() {
        const attackX = this.x + Math.cos(this.rotation) * this.weapon.range;
        const attackY = this.y + Math.sin(this.rotation) * this.weapon.range;
        
        const slash = this.scene.add.circle(attackX, attackY, this.weapon.range / 2, this.weapon.color, 0.5);
        this.scene.time.delayedCall(100, () => slash.destroy());
        slash.setData('damage', this.weapon.damage);
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
                if (dist < this.weapon.range) {
                    enemy.takeDamage(this.weapon.damage);
                }
            });
        }
        
        // Проверка босса
        if (this.scene.boss && this.scene.boss.active) {
            const dist = Phaser.Math.Distance.Between(attackX, attackY, this.scene.boss.x, this.scene.boss.y);
            if (dist < this.weapon.range) {
                this.scene.hitBoss({ damage: this.weapon.damage }, this.scene.boss);
            }
        }
    }

    rangedAttack(pointer) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        const bullet = this.scene.add.sprite(this.x, this.y, 'player');
        // Если есть группа пуль в сцене — добавляем
        if (this.scene.playerBullets) {
            this.scene.physics.add.existing(bullet);
            this.scene.playerBullets.add(bullet);
        }
        bullet.setTint(this.weapon.color);
        bullet.setScale(0.5);
        bullet.rotation = angle;
        bullet.damage = this.weapon.damage;
        bullet.hasHit = false;

        bullet.setData('damage', this.weapon.damage);
        bullet.setData('isPlayerBullet', true);
        bullet.setData('damage', this.weapon.damage);
        
        const tx = this.x + Math.cos(angle) * this.weapon.range;
        const ty = this.y + Math.sin(angle) * this.weapon.range;
        
        const tween = this.scene.tweens.add({
            targets: bullet, x: tx, y: ty, duration: (this.weapon.range / this.weapon.projectileSpeed) * 1000,
            onUpdate: () => {
                if (!bullet || !bullet.active || bullet.hasHit) { tween.stop(); return; }
                
                if (this.scene.enemies) {
                    this.scene.enemies.getChildren().forEach(e => {
                        if (Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y) < 30) {
                            e.takeDamage(bullet.damage);
                            bullet.hasHit = true;
                            tween.stop();
                            bullet.destroy();
                        }
                    });
                }
            },
            onComplete: () => { if (bullet && bullet.active) bullet.destroy(); }
        });
    }

    takeDamage(amount) {
        if (this.isDashing) return;
        this.hp -= amount;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
        
        if (this.scene.updateHealthBar) {
            this.scene.updateHealthBar(this.hp, this.maxHp);
        }
        
        if (this.hp <= 0) {
            const indicator = document.querySelector('.weapon-indicator');
            if (indicator) indicator.remove();
            this.scene.scene.start('HubScene');
        }
    }
}