import { PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_ATTACK_DAMAGE, PLAYER_ATTACK_COOLDOWN, PLAYER_DASH_COOLDOWN, PLAYER_DASH_SPEED, PLAYER_DASH_DURATION, CONTROLS } from '../utils/constants.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speed = PLAYER_SPEED;
        this.hp = PLAYER_MAX_HP;
        this.maxHp = PLAYER_MAX_HP;
        this.attackDamage = PLAYER_ATTACK_DAMAGE;
        this.attackCooldown = PLAYER_ATTACK_COOLDOWN;
        this.lastAttack = 0;
        
        this.isDashing = false;
        this.dashCooldown = PLAYER_DASH_COOLDOWN;
        this.lastDash = 0;
        this.dashSpeed = PLAYER_DASH_SPEED;
        
        this.setCollideWorldBounds(true);
        this.setSize(28, 28);
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: CONTROLS.UP,
            down: CONTROLS.DOWN,
            left: CONTROLS.LEFT,
            right: CONTROLS.RIGHT,
            dash: CONTROLS.DASH
        });
    }

    update(time, pointer) {
        if (this.isDashing) return;
        
        this.setVelocity(0);
        if (this.cursors.left.isDown || this.wasd.left.isDown) this.setVelocityX(-this.speed);
        if (this.cursors.right.isDown || this.wasd.right.isDown) this.setVelocityX(this.speed);
        if (this.cursors.up.isDown || this.wasd.up.isDown) this.setVelocityY(-this.speed);
        if (this.cursors.down.isDown || this.wasd.down.isDown) this.setVelocityY(this.speed);
        
        if (pointer.worldX) this.rotation = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd.dash) && time > this.lastDash) {
            this.isDashing = true;
            this.lastDash = time + this.dashCooldown;
            this.setVelocity(Math.cos(this.rotation) * this.dashSpeed, Math.sin(this.rotation) * this.dashSpeed);
            this.setAlpha(0.6);
            this.body.checkCollision.none = true;
            scene.time.delayedCall(PLAYER_DASH_DURATION, () => {
                this.isDashing = false;
                this.setAlpha(1);
                this.body.checkCollision.none = false;
            });
        }
        
        if (pointer.leftButtonDown() && time > this.lastAttack) {
            this.attack(pointer);
            this.lastAttack = time + this.attackCooldown;
        }
    }

    attack(pointer) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
        const bullet = this.scene.add.sprite(this.x, this.y, 'player');
        bullet.setTint(0xffdd44);
        bullet.setScale(0.5);
        bullet.rotation = angle;
        bullet.damage = this.attackDamage;
        bullet.hasHit = false;
        
        const tx = this.x + Math.cos(angle) * 500;
        const ty = this.y + Math.sin(angle) * 500;
        
        const tween = this.scene.tweens.add({
            targets: bullet, x: tx, y: ty, duration: 800,
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
                
                if (this.scene.boss && this.scene.boss.active) {
                    if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.scene.boss.x, this.scene.boss.y) < 50) {
                        this.scene.hitBoss(bullet, this.scene.boss);
                        bullet.hasHit = true;
                        tween.stop();
                        bullet.destroy();
                    }
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
        if (this.hp <= 0) this.scene.scene.start('HubScene');
    }
}