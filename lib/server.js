var prime = require('prime');
var type = require('prime/type');
var emitter = new (require('prime/emitter'));
// var Map = require('prime/map')
// var map = Map()
var cookie = require('cookie');
var connect = require('connect');

module.exports = prime({
	_options: {},
	_arena: false,
	_loop: false,
	_playerNames: [],
	_bound: {},
	constructor: function(io, server) {
		this._arena = new (require(__dirname+'/arena.js'));
		var namespace = '/arena';
		logger.info('Configuring namespace:', namespace)
		io.configure(function() {
			io.enable('browser client etag');          // apply etag caching logic based on version number
			io.enable('browser client gzip');          // gzip the file	
			io.set('log level', 1);
		});

		io.configure('prod', function () { 
			logger.info('Starting in production mode');
			io.enable('browser client minification');
			io.enable('browser client gzip');          // gzip the file	
			io.enable('browser client etag');
			// io.set('transports', ['websocket']);
		});


		io.configure('dev', function(){
			logger.info('Starting in developmment mode');
			// io.set('transports', ['websocket']);
		});

		io.of(namespace)
		.authorization(function(handshakeData, accept) {
			if (handshakeData.headers.cookie) {
				handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
				handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'helloworld');

				if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
					return accept('Cookie is invalid.', false);
				}
			} else {
				return accept('No cookie transmitted.', false);
			}
			accept(null, true);
		})
		.on('connection', this.socketOnConnect.bind(this, io))
		// .on('disconnect', this.socketOnDisconnect.bind(this, io));
	},
	socketOnConnect: function(io, socket) {
		socket._salt = Math.ceil(Math.random()*100000);
		this._arena.newPlayer(io, socket);
		this._bound.eventSocketInsertCoin = this._arena.insertCoin.bind(this._arena, io, socket);
		socket.on('insertCoin', this._bound.eventSocketInsertCoin);
		this._bound.eventSocketMove = this._arena.movePlayer.bind(this._arena, io, socket);
		socket.on('move', this._bound.eventSocketMove);
	 },
	socketOnDisconnect: function(io, socket) {
		this._arena.removePlayer(socket);
	}
});