import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Lector } from '../entities/Lector.js';
import { Teleportist } from '../entities/Teleportist.js';
import { Sessiya } from '../entities/Sessiya.js';
import { GameProgress } from '../data/progress.js';

export class DungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DungeonScene' });
    }

    init(data) {
        this.course = data.course || 1;
        this.room = data.room || 1;
        this.roomCleared = false;
        this.savedPlayerHp = data.playerHp !== undefined ? data.playerHp : 100;
        this.selectedWeapon = data.weapon || 'ranged';
    }

    create() {
        this.cameras.main.setBackgroundColor('#2a2a3a');
        
        // Стены
        this.walls = this.physics.add.staticGroup();
        this.walls.create(16, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(784, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(400, 16, 'wall').setScale(25, 1).refreshBody();
        this.walls.create(400, 584, 'wall').setScale(25, 1).refreshBody();
        
        // Игрок
        this.player = new Player(this, 400, 500, this.selectedWeapon);
        this.player.hp = this.savedPlayerHp;
        this.physics.add.collider(this.player, this.walls);
        
        // Враги
        this.enemies = this.physics.add.group();
        this.spawnEnemies();
        
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.player, this.enemies, (p, e) => {
            if (this.time.now > e.lastAttack) {
                p.takeDamage(e.damage);
                e.lastAttack = this.time.now + 1000;
            }
        });
        
        // Выход
        this.exitDoor = this.physics.add.sprite(750, 300, 'door').setImmovable(true);
        this.exitDoor.visible = false;
        this.exitDoor.body.enable = false;
        this.physics.add.collider(this.player, this.exitDoor, () => this.nextRoom());
        
        // Визуал комнаты
        this.createRoomLayout();
        
        // UI
        this.createUI();
        this.createHealthBar();
        
        this.input.keyboard.on('keydown-ESC', () => {
            const indicator = document.querySelector('.weapon-indicator');
            if (indicator) indicator.remove();
            this.clearHealthBar();
            this.scene.start('HubScene');
        });
    }

    spawnEnemies() {
        if (this.room === 3) {
            const lector = new Lector(this, 400, 200);
            lector.setTarget(this.player);
            this.enemies.add(lector);
            for (let i = 0; i < 2; i++) {
                const e = new Enemy(this, 200 + i * 200, 350);
                e.setTarget(this.player);
                this.enemies.add(e);
            }
        } else if (this.room === 5) {
            const teleportist = new Teleportist(this, 400, 300);
            teleportist.setTarget(this.player);
            this.enemies.add(teleportist);
            for (let i = 0; i < 2; i++) {
                const e = new Enemy(this, 200 + i * 200, 400);
                e.setTarget(this.player);
                this.enemies.add(e);
            }
        } else if (this.room === 7) {
            const sessiya = new Sessiya(this, 400, 250);
            sessiya.setTarget(this.player);
            this.enemies.add(sessiya);
        } else {
            const count = 2 + this.course + Math.floor(this.room / 2);
            for (let i = 0; i < count; i++) {
                const e = new Enemy(this, 150 + i * 120, 200 + (i % 2) * 100);
                e.setTarget(this.player);
                this.enemies.add(e);
            }
        }
    }

    createRoomLayout() {
        if (this.obstacles) this.obstacles.destroy();
        this.obstacles = this.physics.add.staticGroup();
        
        const colors = {
            1: '#2a3a4a', 2: '#3a3a2a', 3: '#4a2a2a', 4: '#2a4a3a', 5: '#1a3a3a', 6: '#3a2a4a', 7: '#4a1a1a'
        };
        this.cameras.main.setBackgroundColor(colors[this.room] || '#2a2a3a');
        
        // Препятствия для каждой комнаты
        if (this.room === 1) {
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const desk = this.obstacles.create(200 + col * 150, 200 + row * 120, 'wall');
                    desk.setScale(1.2, 0.8).refreshBody().setTint(0x8B6B4D);
                }
            }
        } else if (this.room === 2) {
            for (let i = 0; i < 6; i++) {
                const desk = this.obstacles.create(200 + (i % 3) * 150, 180 + Math.floor(i / 3) * 130 + (i % 2) * 40, 'wall');
                desk.setScale(1.2, 0.8).refreshBody().setTint(0x8B6B4D);
            }
        } else if (this.room === 3) {
            this.obstacles.create(400, 120, 'wall').setScale(2, 1.2).refreshBody().setTint(0x8B4513);
            for (let i = 0; i < 5; i++) {
                const angle = (-50 + i * 25) * Math.PI / 180;
                const desk = this.obstacles.create(400 + Math.sin(angle) * 180, 250 + Math.cos(angle) * 120, 'wall');
                desk.setScale(1.3, 0.8).refreshBody().setTint(0xA0522D);
            }
        } else if (this.room === 5) {
            [250, 550].forEach(x => {
                [200, 400].forEach(y => {
                    this.obstacles.create(x, y, 'wall').setScale(3, 0.7).refreshBody().setTint(0x668888);
                });
            });
        } else if (this.room === 7) {
            this.obstacles.create(400, 150, 'wall').setScale(3, 1).refreshBody().setTint(0x8B4513);
            this.obstacles.create(200, 350, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(600, 350, 'wall').setScale(1.5, 0.8).refreshBody();
        }
        
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);
    }

    createUI() {
        let roomName = `Room ${this.room}`;
        if (this.room === 3) roomName = 'LECTOR';
        else if (this.room === 5) roomName = 'TELEPORTIST';
        else if (this.room === 7) roomName = 'SESSIYA';
        
        this.add.text(400, 30, `Course ${this.course} | ${roomName}`, {
            fontSize: '20px', color: '#fff'
        }).setOrigin(0.5);
        
        this.add.text(400, 560, 'WASD/Arrows | Mouse shoot | SPACE dash | ESC back', {
            fontSize: '14px', color: '#888'
        }).setOrigin(0.5);
    }

    createHealthBar() {
        const oldBar = document.querySelector('.health-bar-container');
        if (oldBar) oldBar.remove();
        
        const container = document.createElement('div');
        container.className = 'health-bar-container';
        
        this.healthFill = document.createElement('div');
        this.healthFill.className = 'health-bar-fill';
        container.appendChild(this.healthFill);
        
        this.healthText = document.createElement('div');
        this.healthText.className = 'health-bar-text';
        container.appendChild(this.healthText);
        
        document.getElementById('game-container').appendChild(container);
        this.updateHealthBar(this.player.hp, this.player.maxHp);
    }

    updateHealthBar(current, max) {
        if (this.healthFill && this.healthText) {
            const percent = (current / max) * 100;
            this.healthFill.style.width = Math.max(0, percent) + '%';
            this.healthText.textContent = `${Math.max(0, current)}/${max}`;
        }
    }

    clearHealthBar() {
        const healthBar = document.querySelector('.health-bar-container');
        if (healthBar) healthBar.remove();
    }

    update(time) {
        if (this.player) this.player.update(time, this.input.activePointer);
        this.enemies.getChildren().forEach(e => e.update(time));
        
        if (this.enemies.getLength() === 0 && !this.roomCleared) {
            this.roomCleared = true;
            this.exitDoor.visible = true;
            this.exitDoor.body.enable = true;
        }
    }

    nextRoom() {
        const currentHp = this.player ? this.player.hp : 100;
        
        if (this.room < 7) {
            this.scene.restart({
                course: this.course,
                room: this.room + 1,
                playerHp: currentHp,
                weapon: this.selectedWeapon
            });
        } else {
            GameProgress.complete(this.course);
            this.clearHealthBar();
            const indicator = document.querySelector('.weapon-indicator');
            if (indicator) indicator.remove();
            this.scene.start('HubScene');
        }
    }
}