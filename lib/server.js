var prime = require('prime')
, type = require('prime/type')
, emitter = new (require('prime/emitter'))
, cookie = require('cookie')
, connect = require('connect')
, emitter = new(require('prime/emitter'));

module.exports = prime({
	_arena: false,			// holds the arena object
	_playerNames: [],		// ?? not used yet
	_bound: {},				// holds memoized events
	constructor: function(io, server) {
		// instantiate the arena object
		this._arena = new (require(__dirname+'/arena.js'));
		// set a namespace
		var namespace = '/arena';
		logger.debug('Configuring io namespace:', namespace)
		// some socket.io optimisation..
		io.configure(function() {
			io.enable('browser client etag');          // apply etag caching logic based on version number
			io.enable('browser client gzip');          // gzip the file	
			io.set('log level', 1);
		});

		io.configure('prod', function () { 
			logger.info('Starting io in production mode');
			io.enable('browser client minification');
			io.enable('browser client gzip');          // gzip the file	
			io.enable('browser client etag');
			// io.set('transports', ['websocket']);
		});


		io.configure('dev', function(){
			logger.info('Starting io in developmment mode');
			// io.set('transports', ['websocket']);
		});

		// configure the namespace auth, link socket.io session to the express cookie id
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
			// only accept the user if the cookie matched
			accept(null, true);
		})
		// set the connection and disconnect events
		.on('connection', this.socketOnConnect.bind(this, io))
		.on('disconnect', this.socketOnDisconnect.bind(this, io));
	},
	// when a new user connects..
	socketOnConnect: function(io, socket) {
		// set a unique salt
		socket._salt = Math.ceil(Math.random()*100000);
		// set the player name (passed when connecting to the server)
		socket._playerName = (socket.handshake.query.name ? socket.handshake.query.name : false);
		// create a unique playerId
		socket._playerId = this._arena.makePlayerId(socket);
		// notify the arena to create a new player using the current player's socket
		this._arena.newPlayer(io, socket);
		// bind the insertCoin listener to the current player's socket
		this._bound.eventSocketInsertCoin = this._arena.insertCoin.bind(this._arena, io, socket);
		socket.on('insertCoin', this._bound.eventSocketInsertCoin);
		// bind the move listener to the current player's socket
		this._bound.eventSocketMove = this._arena.movePlayer.bind(this._arena, io, socket);
		socket.on('move', this._bound.eventSocketMove);

		// bin the removeBonus event to a socket io event inside this._arena
		this._bound.eventSocketRemoveBonus = this._arena.removeBonus.bind(this._arena, io, socket);
		emitter.on('arena.removeBonus', this._bound.eventSocketRemoveBonus);

	 },
	 // when a user disconnects
	socketOnDisconnect: function(io, socket) {
		logger.info('-- player !!!!')
		this._arena.removePlayer(socket);
		logger.info('-- player !!!!', ok)
	}
});