import { Game as MainGame } from './scenes/Game';
import { AUTO, Scale, Game } from 'phaser';
import { loadFonts } from './utils/fontLoader';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    audio: {
        noAudio: false
    },
    scene: [
        MainGame
    ]
};

// Load fonts before starting the game
loadFonts()
    .then(() => {
        // Fonts loaded successfully, start the game
        new Game(config);
    })
    .catch(error => {
        console.error('Failed to load fonts:', error);
        // Still start the game, but with fallback font
        new Game(config);
    });
