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
		this._setupSocket();
	},
	cleanup: function() {
	},
	_setupUnit: function() {
		this.setupUnit();
		this.setPrefix(this.prefix);
		this._debug('socket prefix', this.prefix)
		this._bound._eventEmit = this._eventEmit.bind(this);

		this._debug('Company subscribing emit');
		this.subscribe('!emit', this._bound._eventEmit);
		return this;
	},
	_setupSocket: function() {
		this._debug('setup socket!')
		this._socket = io.connect(this.options.socketUrl, {query: "name="+this.options.name});
		this._bound._processRedraw = this._processRedraw.bind(this);
		this._socket.on('refresh', this._bound._processRedraw);
		return this;
	},
	_eventEmit: function(event, payload, callback) {
		var callback = callback ? callback : function(data) {console.log(data); }
		this._debug('socket emitting event', [event, payload, callback]);
		this._socket.emit(event, payload, callback);
	},
	_processRedraw: function(payload) {
		this.copublish('client.redraw', [payload]);
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