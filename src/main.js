import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants.js';
import { GameProgress } from './data/progress.js';
import { BootScene } from './scenes/BootScene.js';
import { HubScene } from './scenes/HubScene.js';
import { DungeonScene } from './scenes/DungeonScene.js';
import { BossScene } from './scenes/BossScene.js';

GameProgress.load();
GameProgress.reset();
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, HubScene, DungeonScene, BossScene]
};

new Phaser.Game(config);