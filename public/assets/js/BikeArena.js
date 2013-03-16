var BikeArena = new Class({
	Implements: [Options, Events, Unit],
	options: {
		socketUrl: false,
		size: {x: 256, y: 256},
		colorBorders: '#eee',
		cellSize: 10,
		offset: {x: 0, y: 0}
	},
	_bound: false,
	_canvas: false,
	_players: {},
	Prefix: 'Arena',
	initialize: function(options) {
		this.setOptions(options);
		// console.log(Cookie.read('express.sid'))
		this._form = document.id('enroll');
		var v = new Form.Validator.Inline(this._form);
		v.addEvent('onFormValidate', function(validates) { return validates; })
		this._gridInit()._setEvents();
	},
	_setEvents: function() {
		this._bound = {
			_eventClickEnroll: this._eventClickEnroll.bind(this),
			_eventClickInsertCoin: this._eventClickInsertCoin.bind(this),
			_eventKeydown: this._eventKeydown.bind(this),
			_companyWelcome: this._companyWelcome.bind(this),
			_companyRefresh: this._companyRefresh.bind(this),
			_companyGameOver: this._companyGameOver.bind(this)
		}
		this._form.addEvent('click:relay(button.submit)', this._bound._eventClickEnroll);
		document.id('insertCoin').addEvent('click', this._bound._eventClickInsertCoin);
		window.addEvent('keydown', this._bound._eventKeydown);
		this.subscribe('Arena.welcome', this._bound._companyWelcome);
		this.subscribe('Arena.refresh', this._bound._companyRefresh);
		this.subscribe('Arena.gameOver', this._bound._companyGameOver);
	},
	_eventClickEnroll: function(e, el) {
		e.stop();
		var form = document.id('enroll');
		if (form.validate()) {
			var name = document.id('f_playerName').get('value');
			_i['socket'] = new BikeSocket({'socketUrl': this.options.socketUrl, 'name': name});
			form.addClass('hidden');
		}
	},
	_eventClickInsertCoin: function(e, el) {
		e.stop();
		// _i['socket'].disconnect();
		// _i['socket'].connect();
		this.copublish('emit', ['insertCoin', false, false]);
		document.id('insertCoin').addClass('hidden');
	},
	_eventKeydown: function(e) {
		if (![37,38,39,40].contains(e.code)) return;
		var keys = {37: 'l', 38: 'u', 39: 'r', 40: 'd'};
		e.stop();
		this.copublish('emit', ['move', keys[e.code], false]);
	},
	_companyWelcome: function(payload) {
		// this._gridLoad(payload);
		console.log('welcome', payload)
		this._playersSet(payload.players);
	},
	_companyRefresh: function(payload) {
		console.log('redraw', payload)
		this._injectBike(payload.player);
	},
	_companyGameOver: function(payload) {
		alert(payload.msg);
		document.id('insertCoin').removeClass('hidden');
	},
	_gridInit: function() {
		// this._canvas = Raphael(document.id('grid'), this.options.size.x*2+'px', this.options.size.y*2+'px');
		this._canvas = Raphael(document.id('grid'), '1000px', '1000px');
		var size = {x: this.options.size.x*2, y: this.options.size.y*2};
		this.options.cellSize = 10
		// many thanks to http://stackoverflow.com/questions/10274284/what-is-the-correct-way-to-draw-straight-lines-using-raphael-js
		for(var x = (this.options.offset.x % this.options.cellSize); x < size.x; x += this.options.cellSize){
			var vpath = "M " + x + " 0 l 0 " + size.y + " z";
			var vline = this._canvas.path(vpath).attr({stroke: this.options.colorBorders});
		}
		for(var y = (this.options.offset.y % this.options.cellSize); y < size.y; y += this.options.cellSize){
			var hpath = "M 0 " + y + " l " + size.x + " 0 z";
			var hline = this._canvas.path(hpath).attr({stroke: this.options.colorBorders});
		}
		this._canvas.renderfix();
		return this;
	},
	// _gridLoad: function(payload) {
	// 	Object.each(payload.grid, function(xAxis, y) {
	// 		Object.each(xAxis, function(id, x) {
	// 			var p = Object.clone(payload.players[id]);
	// 			p._coords.x = x;
	// 			p._coords.y = y;
	// 			console.log(p)
	// 			this._injectBike(p);
	// 		}, this);
	// 	}, this)
	// },
	_playersSet: function(players) {
		Object.each(players, function(p) {
			if (!p._id) console.log('Invalid p._id!', p);
			if (!this._players[p._id]) {
				this._injectScore(p);
				this._players[p._id] = true;
			}
			this._injectBike(p)
		}, this);
		this._canvas.renderfix();
	},
	_injectBike: function(p) {
		if (p._life == 'dead' && this._players[p._id] != 'dead') {
			this._players[p._id] = 'dead';
			document.id('players').getElement('li[rel='+p._id+']').addClass('dead');
		}
		// console.log(p)
		var fillColor = p._life == 'dead' ? p._color : 'white';
		if (p._current)
			return this._canvas.rect(p._current.x*this.options.cellSize, p._current.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor});
		else 
		{
			Array.each(p._coords, function(coords) {
				// console.log(p._id,'c',coords)
				this._canvas.rect(coords.x*this.options.cellSize, coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor});
			}, this);
		}
		//return this._canvas.rect(p._coords.x*this.options.cellSize, p._coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor});
	},
	_injectScore: function(p) {
		var ul = document.id('players');
		var li = new Element('li', {'rel': p._id}).inject(ul);
		new Element('span', {'class': 'bullet', 'styles': {'border': '2px solid '+p._color}}).inject(li);
		new Element('span', {'class': 'name', 'html': p._name}).inject(li);
		if (p._life == 'dead') li.addClass('dead');
	},
	_draw: function(payload) {

	}
})
