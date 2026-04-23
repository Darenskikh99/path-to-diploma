import { ENEMY_BASE_HP, ENEMY_BASE_SPEED, ENEMY_BASE_DAMAGE } from '../utils/constants.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.hp = ENEMY_BASE_HP;
        this.speed = ENEMY_BASE_SPEED;
        this.damage = ENEMY_BASE_DAMAGE;
        this.lastAttack = 0;
        this.target = null;
        this.setSize(28, 28);
    }

    update() {
        if (this.target) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.setTint(0xff8888);
        this.scene.time.delayedCall(100, () => this.clearTint());
        if (this.hp <= 0) {
            this.destroy();
        }
    }

    setTarget(p) {
        this.target = p;
    }
}