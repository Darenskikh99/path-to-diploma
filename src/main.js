import Phaser from 'phaser';

// ============================================
//            PROGRESS MANAGER
// ============================================
const GameProgress = {
    courses: { 1: false, 2: false, 3: false, 4: false },
    
    complete: function(course) {
        this.courses[course] = true;
        console.log(`Course ${course} completed!`);
    },
    
    allCompleted: function() {
        return this.courses[1] && this.courses[2] && this.courses[3] && this.courses[4];
    },
    
    reset: function() {
        this.courses = { 1: false, 2: false, 3: false, 4: false };
    }
};

// ============================================
//                 BOOT SCENE
// ============================================
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }
    preload() {
        const g = this.make.graphics({ add: false });
        g.fillStyle(0x4488ff, 1); g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x2266cc, 1); g.fillCircle(16, 16, 6);
        g.generateTexture('player', 32, 32);
        
        const w = this.make.graphics({ add: false });
        w.fillStyle(0x666666, 1); w.fillRect(0, 0, 32, 32);
        w.lineStyle(2, 0x444444); w.strokeRect(1, 1, 30, 30);
        w.generateTexture('wall', 32, 32);
        
        const e = this.make.graphics({ add: false });
        e.fillStyle(0xcc3333, 1); e.fillRect(0, 0, 32, 32);
        e.fillStyle(0x000000); e.fillRect(8, 8, 6, 6); e.fillRect(18, 8, 6, 6);
        e.generateTexture('enemy', 32, 32);
        
        const d = this.make.graphics({ add: false });
        d.fillStyle(0x8B4513, 1); d.fillRect(0, 0, 32, 64);
        d.fillStyle(0xFFD700); d.fillCircle(24, 32, 4);
        d.generateTexture('door', 32, 64);
    }
    create() { this.scene.start('HubScene'); }
}

// ============================================
//                 HUB SCENE
// ============================================
class HubScene extends Phaser.Scene {
    constructor() { super({ key: 'HubScene' }); }
    create() {
        this.cameras.main.setBackgroundColor('#2d2d4a');
        this.add.rectangle(400, 80, 600, 120, 0x8B0000, 0.3);
        this.add.text(400, 60, 'OBShchAGA', { fontSize: '48px', color: '#ffdd99', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 110, 'Room 313', { fontSize: '18px', color: '#aaa' }).setOrigin(0.5);
        this.add.text(400, 170, 'Choose course (1-4):', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        
        const courses = [
            { n: 1, c: 0x44aa44, x: 180 },
            { n: 2, c: 0xaaaa44, x: 300 },
            { n: 3, c: 0xaa6644, x: 420 },
            { n: 4, c: 0xaa4444, x: 540 }
        ];
        
    courses.forEach(c => {
        const completed = GameProgress.courses[c.n];
        const color = completed ? 0x555555 : c.c;
        const btn = this.add.rectangle(c.x, 280, 100, 80, color, 0.8);
        
        if (!completed) {
            btn.setInteractive();
            btn.on('pointerdown', () => this.scene.start('DungeonScene', { course: c.n, room: 1 }));
            btn.on('pointerover', () => btn.setFillStyle(c.c, 1));
            btn.on('pointerout', () => btn.setFillStyle(c.c, 0.8));
        }
        
        this.add.text(c.x, 265, c.n.toString(), { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(c.x, 290, 'Course', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
        
        if (completed) {
            this.add.text(c.x, 315, '✓ DONE', { fontSize: '12px', color: '#0f0' }).setOrigin(0.5);
        }
    });
        
        const diplomaUnlocked = GameProgress.allCompleted();
        const diplomaColor = diplomaUnlocked ? 0xffaa00 : 0x555555;
        const diplomaText = diplomaUnlocked ? '🎓 DIPLOM' : `🔒 DIPLOM (${Object.values(GameProgress.courses).filter(v => v).length}/4)`;

        const diplomaBtn = this.add.rectangle(400, 420, 200, 60, diplomaColor, 0.8);
        if (diplomaUnlocked) {
            diplomaBtn.setInteractive();
            diplomaBtn.on('pointerdown', () => this.scene.start('BossScene'));
            diplomaBtn.on('pointerover', () => diplomaBtn.setFillStyle(0xffcc00, 1));
            diplomaBtn.on('pointerout', () => diplomaBtn.setFillStyle(0xffaa00, 0.8));
        }
        this.add.text(400, 420, diplomaText, { fontSize: '24px', color: diplomaUnlocked ? '#fff' : '#999' }).setOrigin(0.5);
    }
}

// ============================================
//                 PLAYER
// ============================================
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speed = 160;
        this.hp = 100;
        this.maxHp = 100;
        this.attackDamage = 30;
        this.attackCooldown = 350;
        this.lastAttack = 0;
        
        this.isDashing = false;
        this.dashCooldown = 1000;
        this.lastDash = 0;
        this.dashSpeed = 400;
        
        this.setCollideWorldBounds(true);
        this.setSize(28, 28);
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', dash: 'SPACE' });
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
            this.scene.time.delayedCall(150, () => {
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
        bullet.setTint(0xffdd44); bullet.setScale(0.5); bullet.rotation = angle;
        bullet.damage = this.attackDamage; bullet.hasHit = false;
        
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
                        return;
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

// ============================================
//                  ENEMY
// ============================================
class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.hp = 50; this.speed = 80; this.damage = 10; this.lastAttack = 0;
        this.target = null; this.setSize(28, 28);
    }
    update() { if (this.target) this.scene.physics.moveToObject(this, this.target, this.speed); }
    takeDamage(amount) {
        this.hp -= amount;
        this.setTint(0xff8888);
        this.scene.time.delayedCall(100, () => this.clearTint());
        if (this.hp <= 0) this.destroy();
    }
    setTarget(p) { this.target = p; }
}

    class Lector extends Enemy {
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
            
            // Стрельба каждые 1.5 секунды
            if (time > this.lastAttack) {
                console.log('LECTOR SHOOTING!');
                
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
                    
                    if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
                        bullet.destroy();
                        clearInterval(interval);
                    }
                }, 16);
                
                this.scene.time.delayedCall(3000, () => {
                    clearInterval(interval);
                    if (bullet && bullet.active) bullet.destroy();
                });
                
                this.lastAttack = time + 1500;
            }
            
            // Призыв миньонов каждые 5 секунд
            if (time > this.lastSummon) {
                console.log('LECTOR SUMMONING!');
                
                for (let i = 0; i < 2; i++) {
                    const offsetX = (i === 0 ? -50 : 50);
                    const minion = new Enemy(this.scene, this.x + offsetX, this.y + 30);
                    minion.setTarget(this.target);
                    minion.setTint(0xff6666);
                    minion.setScale(0.8);
                    
                    if (this.scene.enemies) {
                        this.scene.enemies.add(minion);
                    }
                }
                
                this.lastSummon = time + 5000;
            }
        }
    }

    // ============================================
    //              TELEPORTIST
    // ============================================
    class Teleportist extends Enemy {
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
            
            // Движение к игроку
            if (dist > 150) {
                this.scene.physics.moveToObject(this, this.target, this.speed);
            } else {
                this.setVelocity(0, 0);
            }
            
            // Телепортация каждые 3 секунды
            if (time > this.lastTeleport) {
                console.log('TELEPORTIST TELEPORTING!');
                
                // Эффект исчезновения
                this.scene.add.circle(this.x, this.y, 25, 0x33cccc, 0.5);
                
                // Телепортация в случайное место рядом с игроком
                const angle = Math.random() * Math.PI * 2;
                const distance = 150;
                let newX = this.target.x + Math.cos(angle) * distance;
                let newY = this.target.y + Math.sin(angle) * distance;
                
                // Не выходим за границы
                newX = Math.max(50, Math.min(750, newX));
                newY = Math.max(50, Math.min(550, newY));
                
                this.x = newX;
                this.y = newY;
                
                // Эффект появления
                this.scene.add.circle(newX, newY, 25, 0x33cccc, 0.5);
                
                this.lastTeleport = time + 3000;
            }
            
            // Стрельба каждые 1.5 секунды
            if (time > this.lastAttack) {
                console.log('TELEPORTIST SHOOTING!');
                
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
                    
                    if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
                        bullet.destroy();
                        clearInterval(interval);
                    }
                }, 16);
                
                this.scene.time.delayedCall(3000, () => {
                    clearInterval(interval);
                    if (bullet && bullet.active) bullet.destroy();
                });
                
                this.lastAttack = time + 1500;
            }
        }
    }

    // ============================================
    //                 SESSIYA (MINI-BOSS)
    // ============================================
    class Sessiya extends Enemy {
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
            
            // Фаза 1: агрессивное преследование
            if (this.phase === 1) {
                this.scene.physics.moveToObject(this, this.target, this.speed * 1.3);
                
                if (time > this.lastAttack && dist < 200) {
                    this.attackPhase1();
                    this.lastAttack = time + 1200;
                }
            }
            // Фаза 2: держит дистанцию, больше атак
            else {
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
            
            // Призыв миньонов
            if (time > this.lastSummon) {
                this.summonMinions();
                this.lastSummon = time + 4000;
            }
        }

        attackPhase1() {
            console.log('SESSIYA PHASE 1 ATTACK!');
            
            // Тройной выстрел веером
            const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            for (let i = -1; i <= 1; i++) {
                this.shootBullet(baseAngle + i * 0.3, 250, 0xff6666);
            }
        }

        attackPhase2() {
            console.log('SESSIYA PHASE 2 ATTACK!');
            
            // 5 выстрелов веером
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
                
                if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
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
            console.log('SESSIYA SUMMONING!');
            
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
            
            // Смена фазы при 50% здоровья
            if (this.hp <= this.maxHp / 2 && this.phase === 1) {
                this.phase = 2;
                console.log('SESSIYA PHASE 2!');
                this.scene.add.text(400, 200, '🔥 PHASE 2! 🔥', { fontSize: '40px', color: '#ff0000' }).setOrigin(0.5);
                this.setTint(0xff0000);
            }
            
            if (this.hp <= 0) {
                this.scene.add.text(400, 300, '✅ SESSIYA DEFEATED! ✅', { fontSize: '32px', color: '#44ff44' }).setOrigin(0.5);
                this.destroy();
            }
        }
    }

// ============================================
//               DUNGEON SCENE
// ============================================
class DungeonScene extends Phaser.Scene {
    constructor() { super({ key: 'DungeonScene' }); }
    
    init(data) { this.course = data.course || 1; this.room = data.room || 1; this.roomCleared = false; }
    
    create() {
        this.cameras.main.setBackgroundColor('#2a2a3a');
        
        this.walls = this.physics.add.staticGroup();
        this.walls.create(16, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(784, 300, 'wall').setScale(1, 18).refreshBody();
        this.walls.create(400, 16, 'wall').setScale(25, 1).refreshBody();
        this.walls.create(400, 584, 'wall').setScale(25, 1).refreshBody();
        
        this.player = new Player(this, 400, 500);
        this.physics.add.collider(this.player, this.walls);
        
        this.enemies = this.physics.add.group();
        this.createRoomLayout();


    this.enemies = this.physics.add.group();

    if (this.room === 3) {
        // Лектор
        const lector = new Lector(this, 400, 200);
        lector.setTarget(this.player);
        this.enemies.add(lector);
        for (let i = 0; i < 2; i++) {
            const e = new Enemy(this, 200 + i * 200, 350);
            e.setTarget(this.player);
            this.enemies.add(e);
        }
    } else if (this.room === 5) {
        // Телепортист
        const teleportist = new Teleportist(this, 400, 300);
        teleportist.setTarget(this.player);
        this.enemies.add(teleportist);
        for (let i = 0; i < 2; i++) {
            const e = new Enemy(this, 200 + i * 200, 400);
            e.setTarget(this.player);
            this.enemies.add(e);
        }
    } else if (this.room === 7) {
        // Сессия (финальная комната)
        const sessiya = new Sessiya(this, 400, 250);
        sessiya.setTarget(this.player);
        this.enemies.add(sessiya);
    } else {
        // Обычные враги
        const count = 2 + this.course + Math.floor(this.room / 2);
        for (let i = 0; i < count; i++) {
            const e = new Enemy(this, 150 + i * 120, 200 + (i % 2) * 100);
            e.setTarget(this.player);
            this.enemies.add(e);
        }
    }
        
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.player, this.enemies, (p, e) => {
            if (this.time.now > e.lastAttack) {
                p.takeDamage(e.damage);
                e.lastAttack = this.time.now + 1000;
            }
        });
        
        this.exitDoor = this.physics.add.sprite(750, 300, 'door').setImmovable(true);
        this.exitDoor.visible = false;
        this.exitDoor.body.enable = false;
        this.physics.add.collider(this.player, this.exitDoor, () => this.nextRoom());
        
        let roomName = `Room ${this.room}`;
        if (this.room === 3) roomName = 'Lector';
        else if (this.room === 5) roomName = 'Teleportist';
        else if (this.room === 7) roomName = 'SESSIYA';

        this.add.text(400, 30, `Course ${this.course} | ${roomName}`, { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 550, 'WASD/Arrows | Mouse shoot | SPACE dash | ESC back', { fontSize: '14px', color: '#888' }).setOrigin(0.5);
        
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('HubScene'));
    }

    createRoomLayout() {
    // Удаляем старые препятствия, если они есть
    if (this.obstacles) {
        this.obstacles.destroy();
    }
    // Создаём новую группу
    this.obstacles = this.physics.add.staticGroup();
        
        // Цвет фона в зависимости от комнаты
        const colors = {
            1: '#2a3a4a', // Кабинет - синеватый
            2: '#3a3a2a', // Кабинет - зеленоватый
            3: '#4a2a2a', // Лекционный зал - красноватый
            4: '#2a4a3a', // Кабинет - бирюзовый
            5: '#1a3a3a', // Лаборатория - холодный сине-зелёный
            6: '#3a2a4a', // Кабинет - фиолетовый
            7: '#4a1a1a'  // Экзамен - тёмно-красный
        };
        this.cameras.main.setBackgroundColor(colors[this.room] || '#2a2a3a');
        
        // Добавляем препятствия
        if (this.room === 1) {
            // Кабинет: парты рядами
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const x = 200 + col * 150;
                    const y = 200 + row * 120;
                    const desk = this.obstacles.create(x, y, 'wall');
                    desk.setScale(1.2, 0.8);
                    desk.refreshBody();
                    desk.setTint(0x8B6B4D);
                }
            }
            // Доска
            this.add.rectangle(400, 70, 120, 30, 0x2d5a27);
            this.add.rectangle(400, 70, 110, 22, 0x1a3a17);
        }
        
        else if (this.room === 2) {
            // Кабинет: парты в шахматном порядке
            for (let i = 0; i < 6; i++) {
                const x = 200 + (i % 3) * 150;
                const y = 180 + Math.floor(i / 3) * 130 + (i % 2) * 40;
                const desk = this.obstacles.create(x, y, 'wall');
                desk.setScale(1.2, 0.8);
                desk.refreshBody();
                desk.setTint(0x8B6B4D);
            }
        }
        
        else if (this.room === 3) {
            // Лекционный зал: кафедра и парты полукругом
            // Кафедра
            const podium = this.obstacles.create(400, 120, 'wall');
            podium.setScale(2, 1.2);
            podium.refreshBody();
            podium.setTint(0x8B4513);
            
            // Доска
            this.add.rectangle(400, 70, 140, 35, 0x2d5a27);
            
            // Парты полукругом
            for (let i = 0; i < 5; i++) {
                const angle = -50 + i * 25;
                const rad = angle * Math.PI / 180;
                const x = 400 + Math.sin(rad) * 180;
                const y = 250 + Math.cos(rad) * 120;
                const desk = this.obstacles.create(x, y, 'wall');
                desk.setScale(1.3, 0.8);
                desk.refreshBody();
                desk.setTint(0xA0522D);
            }
        }
        
        else if (this.room === 4) {
            // Кабинет: парты вдоль стен
            this.obstacles.create(150, 200, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(150, 350, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(650, 200, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(650, 350, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(400, 450, 'wall').setScale(1.5, 0.8).refreshBody();
        }
        
        else if (this.room === 5) {
            // Лаборатория: длинные столы
            this.obstacles.create(250, 200, 'wall').setScale(3, 0.7).refreshBody().setTint(0x668888);
            this.obstacles.create(550, 200, 'wall').setScale(3, 0.7).refreshBody().setTint(0x668888);
            this.obstacles.create(250, 400, 'wall').setScale(3, 0.7).refreshBody().setTint(0x668888);
            this.obstacles.create(550, 400, 'wall').setScale(3, 0.7).refreshBody().setTint(0x668888);
            
            // Колбы на столах (декорация)
            this.add.circle(220, 190, 6, 0x44aaff, 0.6);
            this.add.circle(280, 210, 6, 0xff4444, 0.6);
            this.add.circle(520, 190, 6, 0x44ff44, 0.6);
            this.add.circle(580, 210, 6, 0xffaa00, 0.6);
        }
        
        else if (this.room === 6) {
            // Кабинет: круговая расстановка
            for (let i = 0; i < 6; i++) {
                const angle = i * 60 * Math.PI / 180;
                const x = 400 + Math.cos(angle) * 150;
                const y = 300 + Math.sin(angle) * 120;
                const desk = this.obstacles.create(x, y, 'wall');
                desk.setScale(1.2, 0.8);
                desk.refreshBody();
            }
        }
        
        else if (this.room === 7) {
            // Экзамен: большая парта-щит
            const teacherDesk = this.obstacles.create(400, 150, 'wall');
            teacherDesk.setScale(3, 1);
            teacherDesk.refreshBody();
            teacherDesk.setTint(0x8B4513);
            
            // Парты для студентов
            this.obstacles.create(200, 350, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(600, 350, 'wall').setScale(1.5, 0.8).refreshBody();
            this.obstacles.create(400, 450, 'wall').setScale(1.5, 0.8).refreshBody();
            
            // Доска
            this.add.rectangle(400, 80, 160, 35, 0x2d5a27);
            this.add.text(400, 80, 'EXAM', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        }
        
        // Добавляем коллизию игрока и врагов с препятствиями
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);
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
        if (this.room < 7) {
            this.scene.restart({ course: this.course, room: this.room + 1 });
        } else {
            GameProgress.complete(this.course);
            this.scene.start('HubScene');
        }
    }
}

// ============================================
//                 BOSS SCENE
// ============================================
class BossScene extends Phaser.Scene {
    constructor() { super({ key: 'BossScene' }); }
    
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
        this.boss.hp = 500;
        this.boss.maxHp = 500;
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
                
        // Атаки игрока по боссу
        this.physics.add.collider(this.player, this.boss); // уже есть, но для атак нужна отдельная логика
        
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
            for (let i = 0; i < 4; i++) {
                this.shootProjectile(0, 200, 0xff00ff, true); // true = в игрока
            }
        }
        else if (this.boss.phase === 2) {
            const baseAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
            const baseDeg = Phaser.Math.RadToDeg(baseAngle);
            for (let i = -2; i <= 2; i++) {
                this.shootProjectile(baseDeg + i * 20, 250, 0xff6600);
            }
        }
        else {
            // Круговой залп
            for (let i = 0; i < 8; i++) {
                this.shootProjectile(i * 45, 280, 0xff0000);
            }
            // Два снаряда в игрока
            this.shootProjectile(0, 250, 0xff0000, true);
            this.shootProjectile(0, 250, 0xff0000, true);
        }
    }
    
    shootProjectile(angleDeg, speed, color, targetPlayer = false) {
        let angle;
        
        if (targetPlayer && this.player) {
            angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        } else {
            angle = Phaser.Math.DegToRad(angleDeg);
        }
        
        // Создаём снаряд
        const bullet = this.add.sprite(this.boss.x, this.boss.y, 'player');
        bullet.setTint(color);
        bullet.setScale(0.6);
        bullet.rotation = angle;
        bullet.damage = 10;
        
        // Конечная точка
        const distance = 500;
        const targetX = this.boss.x + Math.cos(angle) * distance;
        const targetY = this.boss.y + Math.sin(angle) * distance;
        
        // Анимация через tween
        this.tweens.add({
            targets: bullet,
            x: targetX,
            y: targetY,
            duration: (distance / speed) * 1000,
            onUpdate: () => {
                if (!bullet || !bullet.active) return;
                
                // Проверка попадания в игрока
                if (this.player && this.player.active) {
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                    if (dist < 30) {
                        this.player.takeDamage(bullet.damage);
                        bullet.destroy();
                    }
                }
                
                // Проверка столкновения со стенами
                if (this.walls) {
                    this.walls.getChildren().forEach(wall => {
                        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, wall.x, wall.y);
                        if (dist < 25) {
                            bullet.destroy();
                        }
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
        
        // Проверка попаданий игрока по боссу
        if (this.player && this.boss && this.boss.active) {
            // Упрощённая проверка через активные пули (если есть система атак)
            // В полной версии нужно добавить коллизию пуль с боссом
        }
    }
    
    shutdown() {
        const containers = document.querySelectorAll('#game-container div');
        containers.forEach(c => c.remove());
    }
}

// ============================================
//                 START
// ============================================
const config = {
    type: Phaser.AUTO, width: 800, height: 600, parent: 'game-container', pixelArt: true,
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: [BootScene, HubScene, DungeonScene, BossScene]
};
new Phaser.Game(config);