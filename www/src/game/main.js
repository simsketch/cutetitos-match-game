game.module(
    'game.main'
)
.body(function() {

game.addAsset('tile1.png');
game.addAsset('tile2.png');
game.addAsset('tile3.png');
game.addAsset('tile4.png');
game.addAsset('tile5.png');
game.addAsset('tile6.png');

game.addAsset('logo.png');
game.addAsset('bg.png');
game.createScene('Main', {
    backgroundColor: '#bfd730',
    init: function() {
        var background = new game.Sprite('bg.png').addTo(this.stage);
        background.position.y = -1200;
        this.board = new game.Board(game.width / 2, game.height / 2);
        this.board.container.addTo(this.stage);
        var logo = new game.Sprite('logo.png').addTo(this.stage);
        logo.position.x = (game.width / 2) - (logo.width/2);
    }
});
game.createClass('MyLoader', 'Loader', {
    init: function() {
        var background = new game.Sprite('bg.png').addTo(this.stage);
        background.position.y = -1200;
        background.position.x = -200;
        this.bar = new game.Graphics();
        this.bar.fillColor = '#ffffff';
        this.bar.drawRect(0, 0, 200, 20);
        this.bar.center(this.stage);
        this.bar.addTo(this.stage);
        this.bar.scale.x = 0;
    },

    onProgress: function() {
        this.bar.scale.x = this.percent / 100;
    }
});
game.createClass('Board', {
    boardSize: 6,
    tileTypes: 6,
    tileMargin: 30,
    tileSize: 70,
    tiles: [],
    ready: true,
    _removedTilesCount: 0,
    
    init: function(x, y) {
        this.container = new game.Container();

        var tile;
        for (var i = 0; i < this.boardSize * this.boardSize; i++) {
            tile = new game.Tile(this, i);
            do {
                tile.type = Math.round(Math.random(1, this.tileTypes));
            }
            while (this.isMatch(tile));

            tile.initSprite();
            tile.sprite.addTo(this.container);
            this.tiles.push(tile);
        }

        var size = this.boardSize * this.tileSize + (this.boardSize - 1) * this.tileMargin;
        this.container.anchor.set(size / 2);
        this.container.position.set(x, y);
    },

    getRowNumber: function(tile) {
        return Math.floor(tile.index / this.boardSize);
    },

    getColNumber: function(tile) {
        return tile.index % this.boardSize;
    },

    isSameRow: function(tileA, tileB) {
        return (this.getRowNumber(tileA) === this.getRowNumber(tileB));
    },

    swapTiles: function(tileA, tileB, reverse) {
        this.ready = false;

        this.swapA = tileA;
        this.swapB = tileB;

        var aIndex = tileA.index;
        var bIndex = tileB.index;

        tileA.index = bIndex;
        tileB.index = aIndex;
        this.tiles[aIndex] = tileB;
        this.tiles[bIndex] = tileA;

        tileA.reposition();
        tileB.reposition(this.swapEnd.bind(this, reverse));
    },

    swapEnd: function(reverse) {
        if (reverse) this.ready = true;
        else this.checkForMatches();
    },

    isMatch: function(tile) {
        var left = this.tiles[tile.index - 1];
        var left2 = this.tiles[tile.index - 2];
        var right = this.tiles[tile.index + 1];
        var right2 = this.tiles[tile.index + 2];
        var up = this.tiles[tile.index - this.boardSize];
        var up2 = this.tiles[tile.index - this.boardSize * 2];
        var down = this.tiles[tile.index + this.boardSize];
        var down2 = this.tiles[tile.index + this.boardSize * 2];

        // If 2 same left (same row)
        if (left && left2) {
            if (this.isSameRow(tile, left) && this.isSameRow(tile, left2)) {
                if (tile.type === left.type && tile.type === left2.type) {
                    return true;
                }
            }
        }

        // If 2 same right (same row)
        if (right && right2) {
            if (this.isSameRow(tile, right) && this.isSameRow(tile, right2)) {
                if (tile.type === right.type && tile.type === right2.type) {
                    return true;
                }
            }
        }

        // If same left and right (same row)
        if (left && right) {
            if (this.isSameRow(tile, left) && this.isSameRow(tile, right)) {
                if (tile.type === left.type && tile.type === right.type) {
                    return true;
                }
            }
        }

        // If 2 same up
        if (up && up2) {
            if (tile.type === up.type && tile.type === up2.type) return true;
        }

        // If 2 same down
        if (down && down2) {
            if (tile.type === down.type && tile.type === down2.type) return true;
        }

        // If same up and down
        if (up && down) {
            if (tile.type === up.type && tile.type === down.type) return true;
        }

        return false;
    },
    
    checkForMatches: function() {
        var matchedTiles = [];
        var i;

        // Check for tiles that should be removed
        for (i = 0; i < this.tiles.length; i++) {
            if (this.isMatch(this.tiles[i])) matchedTiles.push(this.tiles[i].index);
        }

        if (matchedTiles.length > 0) {
            this._removedTilesCount += matchedTiles.length;

            // Remove tiles
            for (i = matchedTiles.length - 1; i >= 0; i--) {
                this.tiles[matchedTiles[i]].remove(i === matchedTiles.length - 1 ? this.removeEnd.bind(this) : false, i, true);
            }
        }
        // No tiles to remove, round end
        else {
            if (this._removedTilesCount === 0) {
                // No tiles removed, swap tiles back
                this.swapTiles(this.swapA, this.swapB, true);
            }
            else {
                // Check if there is no more possible moves
                if (!this.checkForPossibleMoves()) {
                    // Remove 10 random tiles
                    this.removeRandomTiles(10);
                    return;
                }

                // Reset
                this._removedTilesCount = 0;
                this.ready = true;
            }
        }
    },

    removeRandomTiles: function(count, callback) {
        var removedTiles = [];

        do {
            var randomIndex = Math.round(Math.random(0, this.tiles.length - 1));
            if (removedTiles.indexOf(randomIndex) === -1) removedTiles.push(randomIndex);
        }
        while (removedTiles.length < count);

        callback = callback || this.removeEnd.bind(this);

        for (var i = removedTiles.length - 1; i >= 0; i--) {
            this.tiles[removedTiles[i]].remove(i === removedTiles.length - 1 ? callback : false, i);
        }
    },

    checkForPossibleMoves: function() {
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            var tileType = tile.type;

            var left = this.tiles[tile.index - 1];
            var right = this.tiles[tile.index + 1];
            var up = this.tiles[tile.index - this.boardSize];
            var down = this.tiles[tile.index + this.boardSize];

            var tiles = [];
            if (left && this.isSameRow(tile, left)) tiles.push(left);
            if (right && this.isSameRow(tile, right)) tiles.push(right);
            if (up) tiles.push(up);
            if (down) tiles.push(down);

            for (var o = 0; o < tiles.length; o++) {
                var target = tiles[o];

                var targetType = target.type;

                // Swap types
                tile.type = targetType;
                target.type = tileType;

                // Check for match
                var match = this.isMatch(tile);

                // Swap types back
                tile.type = tileType;
                target.type = targetType;

                if (match) return true;
            }
        }
        return false;
    },

    removeEnd: function() {
        this.repositionTiles();
    },

    getDroppingTileForCol: function(col, index) {
        for (var i = index; i >= 0; i--) {
            if (!this.tiles[i].removed && this.getColNumber(this.tiles[i]) === col) {
                return this.tiles[i];
            }
        }
    },

    repositionTiles: function() {
        var dropIndexes = [];

        // Get new indexes for tiles
        for (var i = this.tiles.length - 1; i >= 0; i--) {
            if (this.tiles[i].removed) {
                var droppingTile = this.getDroppingTileForCol(this.getColNumber(this.tiles[i]), i);

                if (droppingTile) {
                    var droppingTileIndex = droppingTile.index;
                    var currentTile = this.tiles[i];

                    this.tiles[i] = droppingTile;
                    this.tiles[i].index = i;
                    dropIndexes.push(i);
                    this.tiles[droppingTileIndex] = currentTile;
                    currentTile.index = droppingTileIndex;
                }
            }
        }

        if (dropIndexes.length > 0) {
            // Drop tiles
            for (var i = dropIndexes.length - 1; i >= 0; i--) {
                this.tiles[dropIndexes[i]].drop(i === 0 ? this.dropEnd.bind(this) : false);
            }
        }
        else {
            this.dropEnd();
        }
    },

    dropEnd: function() {
        var removedTiles = [];

        // Fill removed tiles
        for (var i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].removed) removedTiles.push(this.tiles[i].index);
        }

        for (var i = removedTiles.length - 1; i >= 0; i--) {
            this.tiles[removedTiles[i]].respawn(i === removedTiles.length - 1 ? this.respawnEnd.bind(this) : false, i);
        }
    },

    respawnEnd: function() {
        this.checkForMatches();
    },
    
    setActiveTile: function(tile) {
        if (!this.ready || this.activeTile === tile) return;
        
        if (this.activeTile) {
            this.activeTile.reset();
            
            var dist = Math.abs(this.activeTile.index - tile.index);
            if (dist === 1 || dist === this.boardSize) {
                this.swapTiles(this.activeTile, tile);
                this.activeTile = null;
                return;
            }
        }
        
        this.activeTile = tile;
        tile.select();
    }
});

game.createClass('Tile', {
    dropTime: 600,
    removeTime: 100,
    respawnTime: 200,
    swapTime: 200,

    init: function(board, index) {
        this.board = board;
        this.index = index;
    },

    initSprite: function() {
        this.sprite = new game.Sprite('tile' + this.type + '.png');
        this.sprite.anchorCenter();
        this.sprite.interactive = true;
        this.sprite.mousedown = this.mousedown.bind(this);
        this.sprite.position.set(this.getX(), this.getY());
    },
    
    mousedown: function() {
        this.board.setActiveTile(this);
    },

    getX: function() {
        return this.index % this.board.boardSize * (this.board.tileSize + this.board.tileMargin) + this.board.tileSize / 2;
    },

    getY: function() {
        return Math.floor(this.index / this.board.boardSize) * (this.board.tileSize + this.board.tileMargin) + this.board.tileSize / 2;
    },

    drop: function(callback) {
        this.shouldDrop = false;
        var tween = game.Tween.add(this.sprite.position, {
            x: this.getX(),
            y: this.getY()
        }, this.dropTime, {
            easing: 'Bounce.Out'
        });

        if (typeof callback === 'function') tween.onComplete(callback);

        tween.start();
    },
    
    respawn: function(callback, index) {
        this.type = Math.round(Math.random(1, this.board.tileTypes));
        
        this.sprite.setTexture('tile' + this.type + '.png');
        this.sprite.alpha = 1;
        this.sprite.position.set(this.getX(), this.getY());
        this.sprite.scale.set(0);
        this.removed = false;

        game.Tween.stopTweensForObject(this.sprite);

        var tween = game.Tween.add(this.sprite.scale, {
            x: 1, y: 1
        }, this.respawnTime, {
            easing: 'Back.Out',
            delay: index * 60
        });

        if (typeof callback === 'function') tween.onComplete(callback);

        tween.start();
    },

    reposition: function(callback) {
        var tween = game.Tween.add(this.sprite.position, {
            x: this.getX(),
            y: this.getY()
        }, this.swapTime, {
            easing: 'Quadratic.Out'
        });

        if (typeof callback === 'function') tween.onComplete(callback);

        tween.start();
    },
    
    select: function() {
        this.sprite.scale.set(1.1);
        this.sprite.rotation = -0.1;
        
        game.Tween.add(this.sprite, {
            rotation: 0.1
        }, 200, {
            easing: 'Quadratic.InOut',
            repeat: Infinity,
            yoyo: true
        }).start();
    },

    reset: function() {
        game.Tween.stopTweensForObject(this.sprite);
        this.sprite.scale.set(1);
        this.sprite.rotation = 0;
    },

    remove: function(callback, index) {
        this.removed = true;

        var tween = game.Tween.add(this.sprite, {
            alpha: 0
        }, this.removeTime, {
            delay: index * 100
        });

        if (typeof callback === 'function') tween.onComplete(callback);

        tween.start();
    }
});

});
