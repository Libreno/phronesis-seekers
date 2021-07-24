var config = {
    type: Phaser.CANVAS,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var game = new Phaser.Game(config);

var sprite;
var cursors;
var player1, player2;

function preload() {
    this.load.image('circle', '../assets/car1.png');
    this.load.image('landscape', 'assets/river-5584849_1920.jpg');
}
function create() {
    var self = this;
    self.add.image(800, 600, 'landscape');
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
        console.log(players);
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {

        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('disconnectPlayer', function (playerId) {
        console.log('disconnect');
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });

    this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }
        });
    });

    this.cursors = this.input.keyboard.createCursorKeys();
}
function update() {
    if (this.ship) {

        this.physics.world.wrap(this.ship, 5);
        // emit player movement
        var x = this.ship.x;
        var y = this.ship.y;
        var r = this.ship.rotation;
        if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
        }
// save old position data
        this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
        };
        if (this.cursors.left.isDown) {
            this.ship.setAngularVelocity(-150, 300);
        } else if (this.cursors.right.isDown) {
            this.ship.setAngularVelocity(150, 300);
        } else {
            this.ship.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation + 1.5, 200, this.ship.body.acceleration);
        } else if (this.cursors.down.isDown){
            //this.physics.velocityFromRotation(-(this.ship.rotation + 1.5), 50, this.ship.body.acceleration);
            this.ship.setAcceleration(0);
        } else {
            this.ship.setAcceleration(0);
        }


    }
}

function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'circle').setOrigin(0.5, 0.5).setDisplaySize(58, 83);
    if (playerInfo.team === 'blue') {
        self.ship.setTint(0x0000ff);
    } else {
        self.ship.setTint(0xff0000);
    }
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
}
function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'circle').setOrigin(0.5, 0.5).setDisplaySize(58, 83);
    if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
    } else {
        otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}