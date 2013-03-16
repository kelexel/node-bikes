var prime = require('prime');
var crypto = require('crypto');
var array = require('prime/shell/array')
var object = require('prime/shell/object')

module.exports = prime({
	_options: false,
	_grid: false,
	_players: false,
	constructor: function() {
		logger.info('Configuring arena :', this._options);
		// default options
		this._options = {
			size: {x: 512, y: 512}
		};
		this._players = {};
		// reset the arena at startup
		this._reset();
		// set the reset checker to 10secs
		//setInterval(this._reset.bind(this), 10000);
	},
	// this is run onConnect
	newPlayer: function(io, socket) {
		// // if the player's playerId exist, just assume he just reconnected
		// if (this._players[socket._playerId]) {
		// 	var bike = this._players[socket._playerId];
		// 	logger.info('= player', bike.getName());
		// 	this.refresh(io);
		// 	return;
		// }
		// get random coordinates for a new bike
		var coords = this._pixelRandom();
		// create a new instance of bike, pass it the user's socket._playerId and name
		this._players[socket._playerId] = new (require(__dirname + '/bike.js'))({id: socket._playerId, name: socket._playerName});

		// first time we call bike.setCoords ...
		this._players[socket._playerId].setCoords(coords);

		// store the pixel in a "memory" 3d array
		this._pixelMemorize(socket._playerId, coords);
		logger.info('+ player'+ this._players[socket._playerId].getName(), coords);

		// send back the "welcome" message
		this.socketSendWelcome(socket);
	},
	removePlayer: function(socket) {
		logger.info('- player', socket._playerName);
		delete this._players[socket._playerId];
	},
	movePlayer: function(io, socket, direction) {
		// if the user has no _playerId, than we have a serious problem
		if (!this._players[socket._playerId]) throw Error('This player does not exist! '+socket._playerId);

		// get the player's object based on his id
		var p = this._players[socket._playerId];

		// if the bike is dead, do nothing else
		if (!p.isAlive()) return;

		// get the bike's current position
		var coords = p.getLastCoords();
		var nCoords = {x: coords.x, y: coords.y};
		// console.log('current coordinates', coords)
		// get the new coordinates based on it's course
		if (direction == 'u' && nCoords.y > 0 && p.getCourse() != 'd') nCoords.y--;
		else if (direction == 'd' && nCoords.y < this._options.size.y  && p.getCourse() != 'u') nCoords.y++;
		else if (direction == 'l' && nCoords.x > 0  && p.getCourse() != 'r') nCoords.x--;
		else if (direction == 'r' && nCoords.x < this._options.size.x && p.getCourse() != 'l') nCoords.x++;
		else return;
		logger.debug('moving '+socket._playerId, direction)

		// if the new coordinates don't collide
		if (!this._pixelCollides(nCoords))
		{
			// store the new course, add the new coordinates
			p.setCourse(direction).setCoords(nCoords);
			// memorize the pixel
			this._pixelMemorize(socket._playerId, nCoords);
		}
		// or else, kill the bike
		else {
			p.kill();
			this.socketSendGameOver(socket, p);
		}

		var callback = this.socketSendGameOver.bind(this, socket, p);
		this.socketSendRefresh(io, p, callback);
	},
	socketSendWelcome: function(socket) {
		// sends the memorized grid and players
		socket.emit('welcome', {'players': this._players});
	},
	socketSendGameOver: function(socket, p) {
		if (p.isAlive()) return true;
		socket.emit('gameOver', {'msg': 'thou are dead'});
	},
	insertCoin: function(io, socket) {
		// creates a new game for the current player
		socket._salt = Math.ceil(Math.random()*100000);
		socket._playerId = this.makePlayerId(socket);
		logger.info('$ player '+socket._playerName);
		this.removePlayer(socket);
		this.newPlayer(io, socket)
	},
	// sends the current player's coordinates to the socket room
	socketSendRefresh: function(io, p, callback) {
		io.of('/arena').emit('refresh', {'player': p.getCompact()}, callback);
	},
	// reset the arena and players
	_reset: function() {
		if (object.count(this._grid) > 0) return;
		logger.info('reseting arena');
		this._grid = {};
		this._players = {};
		return this;
	},
	// creates a unique player id
	makePlayerId: function(socket) {
		return crypto.createHash('md5').update(socket.handshake.sessionID+socket.id+socket._salt).digest("hex");
	},
	// get a random pixel position
	_pixelRandom: function() {
		var cellSize = 10;
		var coords = {
			'x': Math.floor((Math.random()*(this._options.size.x/cellSize))),
			'y': Math.floor((Math.random()*(this._options.size.y/cellSize)))
		};
		return this._pixelCollides(coords) ? this._pixelRandom() : coords;
	},
	// check if current coordinates collides with memorized ones
	_pixelCollides: function(coords) {
		return !this._grid || !this._grid[coords.y] || !this._grid[coords.y][coords.x] ? false : true;
	},
	// memorize given coordinates
	_pixelMemorize: function(id, coords) {
		if (!this._grid) throw Error('Invalid grid!');
		if (!id) throw Error('Invalid id!');
		if (!this._grid[coords.y]) this._grid[coords.y] = {};
		this._grid[coords.y][coords.x] = id;
		return this;
	},
	// forgets a memorized set of given coordinates
	_pixeForget: function(coords) {
		if (!this._grid) throw Error('Invalid grid!');
		if (!this._grid[coords.y]) return this;
		this._grid[coords.y][coords.x] = false;
		return this;
	},
	// resets a given coordinates
	_pixelReset: function(coords) {
		if (!this._grid) throw Error('Invalid grid!');
		this._grid[coords.y][coords.x] = false;
	}
});