var prime = require('prime')
, crypto = require('crypto')
, array = require('prime/shell/array')
, object = require('prime/shell/object')
, regexp = require('prime/shell/regexp')
, number = require('prime/shell/number');

module.exports = prime({
	_options: false,
	_grid: false,
	_players: false,
	_bonuses: false,
	_idMap: false,
	constructor: function() {
		logger.debug('instantiating arena');
		// default options
		this._options = {
			size: {x: 790, y: 790},
			offset: {x: 1, y: 1},
			cellSize: 10,
			width: '100%',
			height: '100%',
			maxBonus: 150
		};
		this._idMap = {};
		this._bonuses = new (require(__dirname+'/bonuses.js'))(this._options);
		this._players = {};

		// reset the arena at startup
		this._reset();
	},
	// creates a unique player id
	makePlayerId: function(socket, force) {
		if (this._idMap[socket.handshake.signedCookies['connect.sid']] && !force) return this._idMap[socket.handshake.signedCookies['connect.sid']];
		var id = crypto.createHash('md5').update(socket.handshake.sessionID+socket.id+socket._salt).digest("hex");
		this._idMap[socket.handshake.signedCookies['connect.sid']] = id;
		return id;
	},
	// this is run onConnect
	newPlayer: function(io, socket) {
		// if the player's playerId exist, just assume he just reconnected
		if (this._players[socket._playerId]) {
			var bike = this._players[socket._playerId];
			logger.info('= player', bike.getName());
			this._socketSendWelcome(socket);
			this._socketsSendNewPlayer(io, this._players[socket._playerId]);
			return;
		}
		// get random coordinates for a new bike
		var coords = this._pixelRandom();
		// create a new instance of bike, pass it the user's socket._playerId and name
		this._players[socket._playerId] = new (require(__dirname + '/bike.js'))({id: socket._playerId, name: socket._playerName});

		// first time we call bike.setCoords ...
		this._players[socket._playerId].setCoords(coords);

		// store the pixel in a "memory" 3d array
		this._pixelMemorize(socket._playerId, coords, 'player');
		logger.info('+ player'+ this._players[socket._playerId].getName(), coords);

		// send back the "welcome" message right after sending the player info to existing players
		this._socketSendWelcome(socket);
		this._socketsSendNewPlayer(io, this._players[socket._playerId]);
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
		var coords = p.getCurrentCoords();
		var nCoords = {x: coords.x, y: coords.y};

		if (p.isBlocked() && direction == p.getCourse())
			return;
		else if (p.isBlocked() && direction != p.getCourse())
			p.unblock();

		// get the new coordinates based on it's course
		if (direction == 'u' && nCoords.y > 0 && p.getCourse() != 'd') nCoords.y--;
		else if (direction == 'd' && nCoords.y < Math.floor(this._options.size.y/this._options.cellSize)  && p.getCourse() != 'u') nCoords.y++;
		else if (direction == 'l' && nCoords.x > 0  && p.getCourse() != 'r') nCoords.x--;
		else if (direction == 'r' && nCoords.x < Math.floor(this._options.size.x/this._options.cellSize) && p.getCourse() != 'l') nCoords.x++;
		else return;
//		logger.debug('moving '+socket._playerId, direction)
		if (p.isOversized()) {
			this._trimPlayerSize(p);
		}

		// if the new coordinates don't collide
		var collision = this._pixelCollides(nCoords, 'player');

		// if there is a collision with a player, not a bonus
		if (collision)
			p.kill();
		// else there is no collision or there is collision with a bonus
		else {
			// set course and new coordinates
			p.setCourse(direction).setCoords(nCoords);
			
			// is there collision with a bonus?
			var bonus = this._pixelCollides(nCoords, 'bonus');
			if (bonus){
				// yes, so apply the bonus to the player
				this._bonuses.apply(bonus, p);
				// get new coordinates instead the bonus changed them
				var nCoords = p.getCurrentCoords();
			}
			if (p.isBlocked()) return;

			// memorize the player new coordinates
			this._pixelMemorize(socket._playerId, nCoords, 'player');
		}


		if (!p.isAlive())
			this._socketSendGameOver(socket, p);

		this._socketsSendMove(io, p);
	},

	insertCoin: function(io, socket) {
		// creates a new game for the current player
		socket._salt = number.random(1, 100000);
		socket._playerId = this.makePlayerId(socket, true);
		logger.info('$ player '+socket._playerName);
		this.removePlayer(socket);
		this.newPlayer(io, socket)
	},
	removeBonus: function(io, bid) {
		var bCoords = this._bonuses.getCoords(bid);
		logger.debug('removeBonus '+bid, bCoords);
		this._pixelForget(bCoords, 'bonus');
		
		this._bonuses.del(bid);
		this._socketsSendRemoveBonus(io, bid);
	},
	_socketSendWelcome: function(socket, callback) {
		logger.debug('_socketSendWelcome');
		// sends the memorized grid and players
		socket.emit('welcome', {'arena': this._options, 'player': {_id: socket._playerId, _name: socket._playerName}, 'players': this._players, 'bonuses': this._bonuses.getBonuses()}, callback);
	},
	// sends the current player's and infos to existing players
	_socketsSendNewPlayer: function(io, p, callback) {
		logger.debug('_socketsSendNewPlayer', p.getId());
		io.of('/arena').emit('newPlayer', {'newPlayer': p}, callback);
	},
	// sends the game over message to a given socket
	_socketSendGameOver: function(socket, p) {
		if (p.isAlive()) return true;
		logger.debug('_socketSendGameOver', socket._playerId);
		socket.emit('gameOver', {'msg': 'thou are dead'});
	},
	// sends the current player's coordinates to the socket room
	_socketsSendMove: function(io, p, callback) {
		logger.debug('_socketsSendMove', p.getId());
		io.of('/arena').emit('move', {'player': p.getCompact()}, callback);
	},
	_socketsSendRemoveBonus: function(io, bid) {
		logger.debug('_socketsSendRemoveBonus', bid);
		io.of('/arena').emit('removeBonus', {'bonus': bid});
	},
	// reset the arena and players
	_reset: function() {
		if (object.count(this._grid) > 0) return;
		logger.debug('reseting arena');
		this._grid = {};
		this._players = {};
		this._injectBonuses();
		return this;
	},
	_injectBonuses: function() {
		var _bonuses = ['1', '2', '3', '4', '-', '+', 'x', 'w', '!'];
		for (i=0; i<this._options.maxBonus; i++) {
			var k = number.random(0, _bonuses.length-1);
			var bid = 'b_'+i;
			var bCoords = this._pixelRandom('bonus');
			this._bonuses.add(bid, {'type': _bonuses[k], 'coords': bCoords});
			this._pixelMemorize(bid, bCoords, 'bonus');
		}
		return this;
	},

	_trimPlayerSize: function(p) {
		this._pixelForget(p.getOldestCoords(), 'player');
		p.shiftCoords();
		return p.isOversized() ? this._trimPlayerSize(p) : true;
	},
	// get a random pixel position
	_pixelRandom: function(t) {
		t = !t ? 'player' : t;
		var cellSize = 10;
		var coords = {
			'x': number.random(1, Math.floor(this._options.size.x/cellSize)),
			'y': number.random(1, Math.floor(this._options.size.y/cellSize))
		};
		return this._pixelCollides(coords, t) ? this._pixelRandom(t) : coords;
	},
	// check if current coordinates collides with memorized ones
	_pixelCollides: function(coords, t) {
		t = !t ? 'player' : t;
		logger.debug('checking collision',t)
		return !this._grid || !this._grid[coords.y] || !this._grid[coords.y][coords.x] || !this._grid[coords.y][coords.x][t] ? false : this._grid[coords.y][coords.x][t];
	},
	// memorize given coordinates
	_pixelMemorize: function(id, coords, t) {
		t = !t ? 'player' : t;
		if (!this._grid) throw Error('Invalid grid!');
		if (!id) throw Error('Invalid id!');
		if (!this._grid[coords.y]) this._grid[coords.y] = {};
		if (!this._grid[coords.y][coords.x]) this._grid[coords.y][coords.x] = {};
		logger.debug('memorizing pixel '+t+' ('+id+') as ', coords)
		this._grid[coords.y][coords.x][t] = id;
		return this;
	},
	// forgets a memorized set of given coordinates
	_pixelForget: function(coords, t) {
		t = !t ? 'player' : t;
		if (!this._grid) throw Error('Invalid grid!');
		if (!this._grid[coords.y]) return this;
		if (!this._grid[coords.y][coords.x]) return this;
		logger.debug('forgeting pixel '+t, coords);
		this._grid[coords.y][coords.x][t] = false;
		return this;
	}
});