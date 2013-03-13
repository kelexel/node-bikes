var prime = require('prime');
var crypto = require('crypto');

module.exports = prime({
	_options: {
		size: {x: 512, y: 512}
	},
	_grid: false,
	_players: {},
	_io: false,
	constructor: function(io) {
		logger.info('Configuring arena :', this._options);
		this._io = io;
		this._generateGrid()
	},
	newPlayer: function(io, socket) {
		if (this._players[this._makePlayerId(socket)]) {
			var bike = this._players[this._makePlayerId(socket)];
			logger.info('= player', bike.getName());
			this.refresh(io);
			return;
		}
		var coords = this._pixelRandom();
		var bike = new (require(__dirname + '/bike.js'))({id: this._makePlayerId(socket), name: (socket.handshake.query.name ? socket.handshake.query.name : false)});
		bike.setCoords(coords);
		this._pixelDraw(bike.getId(), coords);
		logger.info('+ player', bike.getName());
		this._players[bike.getId()] = bike;
		this.refresh(io);
	},
	removePlayer: function(socket) {
		var bike = this._players[this._makePlayerId(socket)];
		this._pixelReset(bike.getCoords())
		logger.info('- player', bike.getName());
		delete this._players[this._makePlayerId(socket)];
	},
	movePlayer: function(io, socket, direction) {
		if (!this._players[this._makePlayerId(socket)]) throw Error('This player does not exist!');
		var p = this._players[this._makePlayerId(socket)];
		if (!p.isAlive()) return;

		var coords = p.getCoords();
		if (direction == 'u' && coords.y > 0 && p.getCourse() != 'd') coords.y--;
		else if (direction == 'd' && coords.y < this._options.size.y  && p.getCourse() != 'u') coords.y++;
		else if (direction == 'l' && coords.x > 0  && p.getCourse() != 'r') coords.x--;
		else if (direction == 'r' && coords.x < this._options.size.x && p.getCourse() != 'l') coords.x++;
		else return;
		// console.log('collides? ', this._pixelCollides(coords))
		if (!this._pixelCollides(coords))
		{
			p.setCourse(direction).setCoords(coords);
			this._pixelDraw(p._id, coords);
		}
		else
			p.kill();
		this.refresh(io)
	},
	refresh: function(io) {
		io.of('/arena').emit('refresh', {'players': this._players});
	},
	_makePlayerId: function(socket) {
		return crypto.createHash('md5').update(socket.handshake.sessionID+socket.id).digest("hex");
	},
	_generateGrid: function() {
		this._grid = {};
		return this;
	},
	_pixelRandom: function() {
		var cellSize = 10;
		var coords = {
			'x': Math.floor((Math.random()*(this._options.size.x/cellSize))),
			'y': Math.floor((Math.random()*(this._options.size.y/cellSize)))
		};
		return this._pixelCollides(coords) ? this._pixelRandom() : coords;
	},
	_pixelCollides: function(coords) {
		return !this._grid || !this._grid[coords.y] || !this._grid[coords.y][coords.x] ? false : true;
	},
	_pixelDraw: function(id, coords) {
		if (!this._grid) throw Error('Invalid grid!');
		if (!id) throw Error('Invalid id!');
		if (!this._grid[coords.y]) this._grid[coords.y] = {};
		this._grid[coords.y][coords.x] = id;
		return this;
	},
	_pixelReset: function(coords) {
		if (!this._grid) throw Error('Invalid grid!');
		this._grid[coords.y][coords.x] = false;
	}
});