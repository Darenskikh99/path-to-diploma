import { GameProgress } from '../data/progress.js';

export class HubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HubScene' });
        this.selectedWeapon = 'ranged';
    }

    create() {
        this.cameras.main.setBackgroundColor('#2d2d4a');
        this.add.rectangle(400, 80, 600, 120, 0x8B0000, 0.3);
        this.add.text(400, 60, 'OBShchAGA', { fontSize: '48px', color: '#ffdd99', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 110, 'Room 313', { fontSize: '18px', color: '#aaa' }).setOrigin(0.5);
        this.add.text(400, 170, 'Choose course (1-4):', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
        
        // Выбор оружия
        this.createWeaponSelection();
        
        // Кнопки курсов
        this.createCourseButtons();
        
        // Кнопка диплома
        this.createDiplomaButton();
        
        this.input.keyboard.on('keydown-B', () => {
        this.scene.start('BossScene');
        });

        this.add.text(400, 560, 'WASD: move | Mouse: shoot | SPACE: dash | ESC: back', { fontSize: '14px', color: '#888' }).setOrigin(0.5);
        this.sound.unlock();
    }

    createWeaponSelection() {
        this.add.text(400, 440, 'Choose weapon:', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5);
        
        const weapons = [
            { name: 'FAST', color: '#44aaff', x: 200, y: 480, weapon: 'fast_melee' },
            { name: 'SLOW', color: '#aa6644', x: 400, y: 480, weapon: 'slow_melee' },
            { name: 'RANGED', color: '#ffdd44', x: 600, y: 480, weapon: 'ranged' }
        ];
        
        weapons.forEach(w => {
            const btn = this.add.rectangle(w.x, w.y, 80, 35, w.color, 0.8)
                .setInteractive()
                .on('pointerdown', () => {
                    this.selectedWeapon = w.weapon;
                    weapons.forEach(ww => {
                        const b = this.children.getByName(ww.weapon + '_btn');
                        if (b) b.setStrokeStyle(0);
                    });
                    btn.setStrokeStyle(3, 0xffffff);
                });
            btn.setName(w.weapon + '_btn');
            this.add.text(w.x, w.y, w.name, { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
        });
        
        const defaultBtn = this.children.getByName('ranged_btn');
        if (defaultBtn) defaultBtn.setStrokeStyle(3, 0xffffff);
        this.input.keyboard.on('keydown-B', () => {
    this.scene.start('BossScene');
});
    }

    createCourseButtons() {
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
                btn.on('pointerdown', () => {
                    this.scene.start('DungeonScene', {
                        course: c.n,
                        room: 1,
                        weapon: this.selectedWeapon
                    });
                });
                btn.on('pointerover', () => btn.setFillStyle(c.c, 1));
                btn.on('pointerout', () => btn.setFillStyle(c.c, 0.8));
            }
            
            this.add.text(c.x, 265, c.n.toString(), { fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(c.x, 290, 'Course', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
            
            if (completed) {
                this.add.text(c.x, 315, '✓ DONE', { fontSize: '12px', color: '#0f0' }).setOrigin(0.5);
            }
        });
    }

    createDiplomaButton() {
        const unlocked = GameProgress.allCompleted();
        const diplomaBtn = this.add.rectangle(400, 370, 200, 50, unlocked ? 0xffaa00 : 0x555555, 0.8);
        
        if (unlocked) {
            diplomaBtn.setInteractive();
            diplomaBtn.on('pointerdown', () => this.scene.start('BossScene'));
        }
        
        this.add.text(400, 370, unlocked ? '🎓 DIPLOM' : `🔒 DIPLOM (${GameProgress.getCompletedCount()}/4)`, {
            fontSize: '20px', color: unlocked ? '#fff' : '#999'
        }).setOrigin(0.5);
    }
}