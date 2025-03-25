import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        // Set black background
        this.cameras.main.setBackgroundColor('#000000');
        
        // Add title
        this.add.text(512, 100, 'BLOCKMASTER', {
            fontFamily: 'Silkscreen',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
            resolution: 1,
            antialias: false
        }).setOrigin(0.5);

        // Add score
        this.add.text(512, 160, 'SCORE: 0', {
            fontFamily: 'Silkscreen',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            resolution: 1,
            antialias: false
        }).setOrigin(0.5);

        // Create 9x9 grid
        const gridSize = 9;
        const cellSize = 40; // Size of each cell in pixels
        const gridWidth = gridSize * cellSize;
        const gridHeight = gridSize * cellSize;
        
        // Calculate grid position to center it
        const startX = (1024 - gridWidth) / 2; // Using game width (1024)
        const startY = (768 - gridHeight) / 2; // Using game height (768)

        // Draw grid lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 1);

        // Draw vertical lines
        for (let i = 0; i <= gridSize; i++) {
            graphics.moveTo(startX + (i * cellSize), startY);
            graphics.lineTo(startX + (i * cellSize), startY + gridHeight);
        }

        // Draw horizontal lines
        for (let i = 0; i <= gridSize; i++) {
            graphics.moveTo(startX, startY + (i * cellSize));
            graphics.lineTo(startX + gridWidth, startY + (i * cellSize));
        }

        graphics.strokePath();
    }
}
