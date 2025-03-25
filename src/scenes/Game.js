import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.gridState = Array(9).fill(null).map(() => Array(9).fill(0));
        this.placedShapes = 0;
        this.currentShapes = [];
        this.placedBlocks = [];
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
        this.scoreText = this.add.text(512, 130, 'SCORE: 0', {
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
        
        // Store grid properties for later use
        this.gridProps = {
            size: gridSize,
            cellSize,
            blockSpacing,
            effectiveCellSize,
            width: gridWidth,
            height: gridHeight,
            startX: Math.floor((1024 - gridWidth) / 2),
            startY: Math.floor((768 - gridHeight) / 2.2)
        };

        const { startX, startY } = this.gridProps;
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

        // Set up drag events
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setDepth(1);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setDepth(0);
            this.tryPlaceShape(gameObject);
        });

        this.generateNewShapes();
    }

    generateNewShapes() {
        // Clean up old draggable shapes
        this.currentShapes.forEach(container => {
            if (container && container.active) {
                container.destroy();
            }
        });
        this.currentShapes = [];
        this.placedShapes = 0;

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
            return total + (shape[0].length * this.gridProps.effectiveCellSize - this.gridProps.blockSpacing);
        }, 0);
        
        // Add spacing between shapes
        const shapeSpacing = 40;
        const totalWidth = totalShapesWidth + (shapeSpacing * (selectedShapes.length - 1));
        
        // Calculate starting X position to center all shapes
        const shapeStartX = this.gridProps.startX + (this.gridProps.width - totalWidth) / 2;
        // Position shapes at the bottom with some padding
        const bottomY = 768 - 20; // 20 pixels from bottom

        let currentX = shapeStartX;

        selectedShapes.forEach((shape) => {
            const shapeWidth = shape[0].length * this.gridProps.effectiveCellSize - this.gridProps.blockSpacing;
            const shapeHeight = shape.length * this.gridProps.effectiveCellSize - this.gridProps.blockSpacing;
            
            // Calculate Y position to align bottom row
            const shapeStartY = bottomY - shapeHeight;
            
            // Create a container for the shape
            const container = this.add.container(currentX, shapeStartY);
            this.currentShapes.push(container);
            
            // Add blocks to the container
            shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        const block = this.add.image(
                            x * this.gridProps.effectiveCellSize + (this.gridProps.cellSize / 2),
                            y * this.gridProps.effectiveCellSize + (this.gridProps.cellSize / 2),
                            'block'
                        ).setDisplaySize(this.gridProps.cellSize, this.gridProps.cellSize);
                        container.add(block);
                    }
                });
            });

            // Store the shape data in the container for later use
            container.shapeData = shape;
            
            // Make the container interactive and draggable
            container.setInteractive(new Phaser.Geom.Rectangle(0, 0, shapeWidth, shapeHeight), Phaser.Geom.Rectangle.Contains);
            this.input.setDraggable(container);
            
            // Store original position for snapping back if invalid placement
            container.originalX = currentX;
            container.originalY = shapeStartY;
            
            currentX += shapeWidth + shapeSpacing;
        });
    }

    tryPlaceShape(container) {
        const { startX, startY, effectiveCellSize, size, cellSize } = this.gridProps;
        
        // Calculate grid position
        const gridX = Math.round((container.x - startX) / effectiveCellSize);
        const gridY = Math.round((container.y - startY) / effectiveCellSize);
        
        // Check if position is valid
        if (this.canPlaceShape(container.shapeData, gridX, gridY)) {
            // Create static blocks at the grid position
            container.shapeData.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        const block = this.add.image(
                            startX + (gridX + x) * effectiveCellSize + (cellSize / 2),
                            startY + (gridY + y) * effectiveCellSize + (cellSize / 2),
                            'block'
                        ).setDisplaySize(cellSize, cellSize);
                        this.placedBlocks.push(block);
                    }
                });
            });
            
            // Place shape in grid state
            this.placeShape(container.shapeData, gridX, gridY);
            
            // Remove the draggable container
            container.destroy();
            
            // Remove from current shapes array
            const index = this.currentShapes.indexOf(container);
            if (index > -1) {
                this.currentShapes.splice(index, 1);
            }
            
            // Increment placed shapes counter
            this.placedShapes++;
            
            // Check if all shapes are placed
            if (this.placedShapes === 3) {
                // Generate new shapes after a short delay
                this.time.delayedCall(300, () => {
                    this.generateNewShapes();
                });
            }
        } else {
            // Invalid placement, return to original position
            container.x = container.originalX;
            container.y = container.originalY;
        }
    }

    canPlaceShape(shape, gridX, gridY) {
        // Check if any part of the shape would be outside the grid
        if (gridX < 0 || gridY < 0 || 
            gridX + shape[0].length > this.gridProps.size || 
            gridY + shape.length > this.gridProps.size) {
            return false;
        }
        
        // Check if all required cells are empty
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {
                if (shape[y][x] === 1 && this.gridState[gridY + y][gridX + x] === 1) {
                    return false;
                }
            }
        }
        
        return true;
    }

    placeShape(shape, gridX, gridY) {
        // Mark cells as occupied
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {
                if (shape[y][x] === 1) {
                    this.gridState[gridY + y][gridX + x] = 1;
                }
            }
        }
    }
}
