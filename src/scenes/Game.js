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
        this.load.image('block', 'block.png');
    }

    create ()
    {
        // Set black background
        this.cameras.main.setBackgroundColor('#000000');
        
        // Add title
        this.add.text(512, 80, 'BLOCKMASTER', {
            fontFamily: 'Silkscreen',
            fontSize: 48,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
            resolution: 1,
            antialias: false
        }).setOrigin(0.5);

        // Add score
        this.add.text(512, 130, 'SCORE: 0', {
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
        const cellSize = 35; // Base cell size
        const blockSpacing = 4; // Space between blocks
        const effectiveCellSize = cellSize + blockSpacing; // Total space per cell including spacing
        const gridWidth = gridSize * effectiveCellSize - blockSpacing; // Subtract last spacing
        const gridHeight = gridSize * effectiveCellSize - blockSpacing;
        
        // Calculate grid position to center it
        const startX = Math.floor((1024 - gridWidth) / 2);
        const startY = Math.floor((768 - gridHeight) / 2);
        const endX = startX + gridWidth;
        const endY = startY + gridHeight;

        // Draw grid lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 1);

        // Draw outer rectangle first
        graphics.beginPath();
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, startY);
        graphics.lineTo(endX, endY);
        graphics.lineTo(startX, endY);
        graphics.lineTo(startX, startY);
        graphics.strokePath();

        // Draw inner vertical lines
        for (let i = 1; i < gridSize; i++) {
            const x = startX + (i * effectiveCellSize);
            graphics.beginPath();
            graphics.moveTo(x, startY);
            graphics.lineTo(x, endY);
            graphics.strokePath();
        }

        // Draw inner horizontal lines
        for (let i = 1; i < gridSize; i++) {
            const y = startY + (i * effectiveCellSize);
            graphics.beginPath();
            graphics.moveTo(startX, y);
            graphics.lineTo(endX, y);
            graphics.strokePath();
        }

        // Create Tetris-like shapes
        const allShapes = [
            // I shape
            [
                [1, 1, 1, 1]
            ],
            // I standing
            [
                [1],
                [1],
                [1],
                [1]
            ],
            // L shape
            [
                [1, 0],
                [1, 0],
                [1, 1]
            ],
            // T shape
            [
                [0, 1, 0],
                [1, 1, 1]
            ],
            // Z shape
            [
                [1, 1, 0],
                [0, 1, 1]
            ],
            // S shape
            [
                [0, 1, 1],
                [1, 1, 0]
            ],
            // O shape  
            [
                [1, 1],
                [1, 1]
            ],
            //big O shape
            [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1]
            ],
            // rect shape
            [
                [1, 1, 1],
                [1, 1, 1]
            ],
            //standing rect
            [
                [1, 1],
                [1, 1],
                [1, 1]
            ],
            // J shape
            [
                [0, 1],
                [0, 1],
                [1, 1]
            ],
            // T shape mirror
            [
                [0, 1, 0],
                [1, 1, 1]
            ],
            // T shape side
            [
                [0, 1],
                [1, 1],
                [0, 1]
            ],
            // T shape side mirror
            [
                [1, 0],
                [1, 1],
                [1, 0]
            ],
            // line shape
            [
                [1, 1, 1, 1, 1]
            ],
            // line shape standing
            [
                [1],
                [1],
                [1],
                [1],
                [1]
            ]
        ];

        // Function to get random shapes
        const getRandomShapes = (count) => {
            const shapes = [...allShapes];
            const selectedShapes = [];
            
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * shapes.length);
                selectedShapes.push(shapes[randomIndex]);
            }
            
            return selectedShapes;
        };

        // Get 3 random shapes
        const selectedShapes = getRandomShapes(3);

        // Calculate total width of selected shapes
        const totalShapesWidth = selectedShapes.reduce((total, shape) => {
            return total + (shape[0].length * effectiveCellSize - blockSpacing);
        }, 0);
        
        // Add spacing between shapes
        const shapeSpacing = 40;
        const totalWidth = totalShapesWidth + (shapeSpacing * (selectedShapes.length - 1));
        
        // Calculate starting X position to center all shapes
        const shapeStartX = startX + (gridWidth - totalWidth) / 2;
        // Position shapes at the bottom with some padding
        const bottomY = 768 - 25; // 25 pixels from bottom

        let currentX = shapeStartX;

        selectedShapes.forEach((shape) => {
            const shapeWidth = shape[0].length * effectiveCellSize - blockSpacing;
            const shapeHeight = shape.length * effectiveCellSize - blockSpacing;
            
            // Calculate Y position to align bottom row
            const shapeStartY = bottomY - shapeHeight;
            
            shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        this.add.image(
                            currentX + (x * effectiveCellSize) + (cellSize / 2),
                            shapeStartY + (y * effectiveCellSize) + (cellSize / 2),
                            'block'
                        ).setDisplaySize(cellSize, cellSize);
                    }
                });
            });
            
            currentX += shapeWidth + shapeSpacing;
        });
    }
}
