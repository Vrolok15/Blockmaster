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
        this.score = 0;
        this.lastPlacedColor = null; // Store the last placed block's color
        this.blockColors = [
            0xff0000, // red
            0x0000ff, // blue
            0x00ff00, // green
            0xffd700, // gold
            0x00ffff, // cyan
            0x800080, // purple
            0xffa500  // orange
        ];
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
        this.createUI();
        this.createGrid();
        this.setupDragEvents();
        this.generateNewShapes();
    }

    createUI() {
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
    }

    createGrid() {
        // Create 9x9 grid
        const gridSize = 9;
        const cellSize = 35; // Base cell size
        const gridWidth = gridSize * cellSize; // No spacing between cells
        const gridHeight = gridSize * cellSize;
        
        // Store grid properties for later use
        this.gridProps = {
            size: gridSize,
            cellSize,
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
            const x = startX + (i * cellSize);
            graphics.beginPath();
            graphics.moveTo(x, startY);
            graphics.lineTo(x, endY);
            graphics.strokePath();
        }

        // Draw inner horizontal lines
        for (let i = 1; i < gridSize; i++) {
            const y = startY + (i * cellSize);
            graphics.beginPath();
            graphics.moveTo(startX, y);
            graphics.lineTo(endX, y);
            graphics.strokePath();
        }

        // Mark this graphics object as grid lines
        graphics.isGrid = true;
    }

    setupDragEvents() {
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
    }

    showGameOver() {
        // Create semi-transparent black overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, 1024, 768);

        // Add Game Over text
        const gameOverText = this.add.text(512, 300, 'GAME OVER', {
            fontFamily: 'Silkscreen',
            fontSize: 64,
            color: '#ffffff',
            align: 'center',
            resolution: 1,
            antialias: false
        }).setOrigin(0.5);

        // Add final score
        const finalScore = this.add.text(512, 380, `FINAL SCORE: ${this.score}`, {
            fontFamily: 'Silkscreen',
            fontSize: 32,
            color: '#ffffff',
            align: 'center',
            resolution: 1,
            antialias: false
        }).setOrigin(0.5);

        // Add restart button
        const restartButton = this.add.text(512, 460, 'RESTART', {
            fontFamily: 'Silkscreen',
            fontSize: 32,
            color: '#ffffff',
            backgroundColor: '#4a4a4a',
            padding: { x: 20, y: 10 },
            align: 'center',
            resolution: 1,
            antialias: false
        }).setOrigin(0.5);

        restartButton.setInteractive({ useHandCursor: true });
        
        // Hover effects
        restartButton.on('pointerover', () => {
            restartButton.setBackgroundColor('#666666');
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setBackgroundColor('#4a4a4a');
        });
        
        restartButton.on('pointerdown', () => {
            this.restartGame();
        });
    }

    restartGame() {
        // Clear the grid state
        this.gridState = Array(9).fill(null).map(() => Array(9).fill(0));
        
        // Reset score
        this.score = 0;
        this.scoreText.setText('SCORE: 0');
        
        // Clear placed blocks
        this.placedBlocks.forEach(block => block.destroy());
        this.placedBlocks = [];
        
        // Clear current shapes
        this.currentShapes.forEach(container => container.destroy());
        this.currentShapes = [];
        
        // Reset placed shapes counter
        this.placedShapes = 0;
        
        // Remove only game over overlay and blocks, preserve grid and score
        this.children.list
            .filter(child => 
                (child.type === 'Text' && child !== this.scoreText) || 
                (child.type === 'Graphics' && !child.isGrid))
            .forEach(child => child.destroy());
        
        // Generate new shapes
        this.generateNewShapes();
    }

    checkGameOver() {
        // Check if any current shape can be placed anywhere on the grid
        return !this.currentShapes.some(container => {
            const shape = container.shapeData;
            // Try every possible position on the grid
            for (let y = 0; y < this.gridProps.size; y++) {
                for (let x = 0; x < this.gridProps.size; x++) {
                    if (this.canPlaceShape(shape, x, y)) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    updateScore(blockCount) {
        this.score += blockCount;
        this.scoreText.setText(`SCORE: ${this.score}`);
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
            // short I shape
            [
                [1, 1, 1]
            ],
            // short I shape standing
            [
                [1],
                [1],
                [1]
            ],
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
            ],
            // 2 piece shape
            [
                [1, 1]
            ],
            // 2 piece shape standing
            [
                [1],
                [1]
            ],
            // 1 piece shape 
            [
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
            return total + (shape[0].length * this.gridProps.cellSize);
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
            const shapeWidth = shape[0].length * this.gridProps.cellSize;
            const shapeHeight = shape.length * this.gridProps.cellSize;
            
            // Calculate Y position to align bottom row
            const shapeStartY = bottomY - shapeHeight;
            
            // Create a container for the shape
            const container = this.add.container(currentX, shapeStartY);
            this.currentShapes.push(container);
            
            // Get a random color for this shape
            const shapeColor = this.blockColors[Math.floor(Math.random() * this.blockColors.length)];
            
            // Add blocks to the container
            shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        const block = this.add.image(
                            x * this.gridProps.cellSize + (this.gridProps.cellSize / 2),
                            y * this.gridProps.cellSize + (this.gridProps.cellSize / 2),
                            'block'
                        ).setDisplaySize(this.gridProps.cellSize, this.gridProps.cellSize);
                        block.setTint(shapeColor);
                        block.color = shapeColor; // Store the color
                        container.add(block);
                    }
                });
            });

            // Store the shape data and color in the container for later use
            container.shapeData = shape;
            container.color = shapeColor;
            
            // Make the container interactive and draggable
            container.setInteractive(new Phaser.Geom.Rectangle(0, 0, shapeWidth, shapeHeight), Phaser.Geom.Rectangle.Contains);
            this.input.setDraggable(container);
            
            // Store original position for snapping back if invalid placement
            container.originalX = currentX;
            container.originalY = shapeStartY;
            
            currentX += shapeWidth + shapeSpacing;
        });

        // After generating shapes, check for game over
        if (this.checkGameOver()) {
            this.showGameOver();
        }
    }

    tryPlaceShape(container) {
        const { startX, startY, cellSize, size } = this.gridProps;
        
        // Calculate grid position
        const gridX = Math.round((container.x - startX) / cellSize);
        const gridY = Math.round((container.y - startY) / cellSize);
        
        // Check if position is valid
        if (this.canPlaceShape(container.shapeData, gridX, gridY)) {
            // Count blocks in the shape
            let blockCount = 0;
            
            // Store the color of the last placed block
            this.lastPlacedColor = container.color;
            
            // Create static blocks at the grid position
            container.shapeData.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell === 1) {
                        const block = this.add.image(
                            startX + (gridX + x) * cellSize + (cellSize / 2),
                            startY + (gridY + y) * cellSize + (cellSize / 2),
                            'block'
                        ).setDisplaySize(cellSize, cellSize);
                        block.setTint(container.color); // Apply the shape's color
                        block.color = container.color; // Store the color
                        block.gridX = gridX + x;
                        block.gridY = gridY + y;
                        this.placedBlocks.push(block);
                        blockCount++;
                    }
                });
            });
            
            // Place shape in grid state
            this.placeShape(container.shapeData, gridX, gridY);
            
            // Update score with actual block count
            this.updateScore(blockCount);

            // Check and clear filled rows and columns
            this.checkAndClearLines();
            
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
            } else if (this.checkGameOver()) {
                // Check for game over after each placement
                this.showGameOver();
            }
        } else {
            // Invalid placement, return to original position
            container.x = container.originalX;
            container.y = container.originalY;
        }
    }

    checkAndClearLines() {
        const size = this.gridProps.size;
        let rowsCleared = 0;
        let columnsCleared = 0;
        
        // Check rows
        for (let y = 0; y < size; y++) {
            if (this.isRowFilled(y)) {
                this.clearRow(y);
                rowsCleared++;
            }
        }
        
        // Check columns
        for (let x = 0; x < size; x++) {
            if (this.isColumnFilled(x)) {
                this.clearColumn(x);
                columnsCleared++;
            }
        }
        
        // Update score for cleared lines
        const linesScore = (rowsCleared + columnsCleared) * 20;
        if (linesScore > 0) {
            this.time.delayedCall(300, () => {
                this.updateScore(linesScore);
                
                // Check if grid is completely empty after clearing
                if (this.isGridEmpty()) {
                    this.showGridClearBonus();
                }
            });
        }
    }

    isRowFilled(y) {
        return this.gridState[y].every(cell => cell === 1);
    }

    isColumnFilled(x) {
        return this.gridState.every(row => row[x] === 1);
    }

    isGridEmpty() {
        return this.gridState.every(row => row.every(cell => cell === 0));
    }

    clearRow(y) {
        // Clear grid state
        this.gridState[y].fill(0);
        
        // Get blocks to remove
        const blocksToRemove = this.placedBlocks.filter(block => block.gridY === y);
        
        // Create single points text for the row
        const pointsText = this.add.text(
            this.gridProps.startX + this.gridProps.width / 2,
            this.gridProps.startY + y * this.gridProps.cellSize + this.gridProps.cellSize / 2,
            '+20',
            {
                fontFamily: 'Silkscreen',
                fontSize: 48,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
                resolution: 1,
                antialias: false
            }
        ).setOrigin(0.5);
        
        // First change color of all blocks
        blocksToRemove.forEach(block => {
            block.setTint(this.lastPlacedColor);
        });
        
        // Set text color
        pointsText.setTint(this.lastPlacedColor);
        
        // Wait 500ms then animate removal
        this.time.delayedCall(300, () => {
            // Animate all blocks at once
            this.tweens.add({
                targets: blocksToRemove,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                y: '-=50', // Move up while fading
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    blocksToRemove.forEach(block => block.destroy());
                }
            });
            
            // Animate points text
            this.tweens.add({
                targets: pointsText,
                alpha: 0,
                scaleX: 1.2,
                scaleY: 1.2,
                y: pointsText.y - 50,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    pointsText.destroy();
                }
            });
        });
        
        // Update placedBlocks array after animation
        this.placedBlocks = this.placedBlocks.filter(block => block.gridY !== y);
    }

    clearColumn(x) {
        // Clear grid state
        for (let y = 0; y < this.gridProps.size; y++) {
            this.gridState[y][x] = 0;
        }
        
        // Get blocks to remove
        const blocksToRemove = this.placedBlocks.filter(block => block.gridX === x);
        
        // Create single points text for the column
        const pointsText = this.add.text(
            this.gridProps.startX + x * this.gridProps.cellSize + this.gridProps.cellSize / 2,
            this.gridProps.startY + this.gridProps.height / 2,
            '+20',
            {
                fontFamily: 'Silkscreen',
                fontSize: 48,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
                resolution: 1,
                antialias: false
            }
        ).setOrigin(0.5);
        
        // First change color of all blocks
        blocksToRemove.forEach(block => {
            block.setTint(this.lastPlacedColor);
        });
        
        // Set text color
        pointsText.setTint(this.lastPlacedColor);
        
        // Wait 500ms then animate removal
        this.time.delayedCall(500, () => {
            // Animate all blocks at once
            this.tweens.add({
                targets: blocksToRemove,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                y: '-=50', // Move up while fading
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    blocksToRemove.forEach(block => block.destroy());
                }
            });
            
            // Animate points text
            this.tweens.add({
                targets: pointsText,
                alpha: 0,
                scaleX: 1.2,
                scaleY: 1.2,
                y: pointsText.y - 50,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    pointsText.destroy();
                }
            });
        });
        
        // Update placedBlocks array after animation
        this.placedBlocks = this.placedBlocks.filter(block => block.gridX !== x);
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

    showGridClearBonus() {
        // Add bonus text
        const bonusText = this.add.text(
            this.gridProps.startX + this.gridProps.width / 2,
            this.gridProps.startY + this.gridProps.height / 2,
            'GRID CLEAR!\n+100',
            {
                fontFamily: 'Silkscreen',
                fontSize: 48,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
                resolution: 1,
                antialias: false
            }
        ).setOrigin(0.5);
        
        // Animate the text
        this.tweens.add({
            targets: bonusText,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                bonusText.destroy();
                this.updateScore(100);
            }
        });
    }
}
