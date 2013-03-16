var BikeSocket = new Class({
	Implements: [Options, Events, Unit],
	options: {
		socketUrl: false,
		debug: false,
		name: false
	},
	_bound: {},
	_socket: false,
	initialize: function(options) {
		this.setOptions(options);
		this._debug('socket init')
		// console.log(this.options.loadSlides)
		if (!this.options.socketUrl) console.log('missing socketurl')
		this._container = document.id('wrapper');
		this._setupUnit();
		this.connect();
	},
	cleanup: function() {
	},
	_setupUnit: function() {
		this.setupUnit();
		this._debug('socket prefix', this.prefix)
		this.setPrefix(this.prefix);
		this._debug('Company subscribing emit');
		this._bound._eventEmit = this._eventEmit.bind(this);
		this.subscribe('!emit', this._bound._eventEmit);
		return this;
	},
	connect: function() {
		this._debug('setup socket!')

		this._socket = io.connect(this.options.socketUrl, {query: "name="+this.options.name});
		this._bound._processWelcome = this._processWelcome.bind(this);
		this._bound._processRefresh = this._processRefresh.bind(this);
		this._bound._processGameOver = this._processGameOver.bind(this);

		this._socket.on('welcome', this._bound._processWelcome);
		this._socket.on('refresh', this._bound._processRefresh);
		this._socket.on('gameOver', this._bound._processGameOver);
		return this;
	},
	disconnect: function() {
		delete this._socket;
		return this;
	},
	_eventEmit: function(event, payload, callback) {
		var callback = callback ? callback : function(data) {console.log(data); }
		this._debug('socket emitting event', [event, payload, callback]);
		this._socket.emit(event, payload, callback);
	},
	_processWelcome: function(payload) {
		this.copublish('Arena.welcome', [payload]);
	},
	_processRefresh: function(payload) {
		this.copublish('Arena.refresh', [payload]);
	},
	_processGameOver: function(payload) {
		this.copublish('Arena.gameOver', [payload]);
	},
	_debug: function(str, msg) {
		if (!this.options.debug || !console || !console.log) return;
		msg = msg ? msg : '';
		if (!this.prefix)
			console.log(str, msg);
		else
			console.log(this.prefix, str, msg);
	}
});