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
	_bonuses: {},
	_player: false,
	Prefix: 'Arena',
	initialize: function(options) {
		this.setOptions(options);
		this._form = document.id('enroll');
		var v = new Form.Validator.Inline(this._form);
		v.addEvent('onFormValidate', function(validates) { return validates; })
		this._setEvents();
	},
	_setEvents: function() {
		this._bound = {
			_eventClickEnroll: this._eventClickEnroll.bind(this),
			_eventClickInsertCoin: this._eventClickInsertCoin.bind(this),
			_eventKeydown: this._eventKeydown.bind(this),
			_companyWelcome: this._companyWelcome.bind(this),
			_companyMove: this._companyMove.bind(this),
			_companyGameOver: this._companyGameOver.bind(this),
			_companyNewPlayer: this._companyNewPlayer.bind(this),
			_companyRemoveBonus: this._companyRemoveBonus.bind(this)
		}
		this._form.addEvent('click:relay(button.submit)', this._bound._eventClickEnroll);
		document.id('insertCoin').addEvent('click', this._bound._eventClickInsertCoin);
		window.addEvent('keydown', this._bound._eventKeydown);
		this.subscribe('Arena.welcome', this._bound._companyWelcome);
		this.subscribe('Arena.move', this._bound._companyMove);
		this.subscribe('Arena.newPlayer', this._bound._companyNewPlayer);
		this.subscribe('Arena.gameOver', this._bound._companyGameOver);
		this.subscribe('Arena.removeBonus', this._bound._companyRemoveBonus);
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
		// if (console && console.log) console.log(e.code)
		if ([27, 13].contains(e.code)) {e.stop(); return; }
		else if (![37,38,39,40].contains(e.code)) return;
		var keys = {37: 'l', 38: 'u', 39: 'r', 40: 'd'};
		e.stop();
		this.copublish('emit', ['move', keys[e.code], false]);
	},
	_companyWelcome: function(payload) {
		this._gridInit(payload.arena);
		document.id('players').set('html', '');
		this._player = payload.player;
		this._playersInit(payload.players);
		this._injectBonuses(payload.bonuses);
	},
	_companyNewPlayer: function(payload) {
		var newPlayer = payload.newPlayer;
		if (newPlayer._id == this._player._id) return;
		this._injectScore(newPlayer);
		this._players[newPlayer._id] = { _life: newPlayer._life, _bikes: [], _size: newPlayer._size, _coords: newPlayer._coords };
		// this._players[payload.newPlayer._id] = true;
		this._injectBike(payload.newPlayer);
	},
	_companyMove: function(payload) {
		this._injectBike(payload.player);
	},
	_companyGameOver: function(payload) {
		alert(payload.msg);
		document.id('insertCoin').removeClass('hidden');
	},
	_companyRemoveBonus: function(payload) {
		this._bonuses[payload.bonus].remove();
		delete this._bonuses[payload.bonus];
	},
	_gridInit: function(options) {
		this._canvas = Raphael(document.id('grid'), options.width, options.height);
		var size = {x: options.size.x*2, y: options.size.y*2};
		// options.cellSize = 10
		// many thanks to http://stackoverflow.com/questions/10274284/what-is-the-correct-way-to-draw-straight-lines-using-raphael-js
		for(var x = (options.offset.x % options.cellSize); x < size.x; x += options.cellSize){
			var vpath = "M " + x + " 0 l 0 " + size.y + " z";
			var vline = this._canvas.path(vpath).attr({stroke: this.options.colorBorders});
		}
		for(var y = (options.offset.y % options.cellSize); y < size.y; y += options.cellSize){
			var hpath = "M 0 " + y + " l " + size.x + " 0 z";
			var hline = this._canvas.path(hpath).attr({stroke: this.options.colorBorders});
		}
		this._canvas.renderfix();
		return this;
	},
	_playersInit: function(players) {
		Object.each(players, function(p) {
			if (!p._id && console && console.log) console.log('Invalid p._id!', p);
			if (!this._players[p._id]) {
				this._injectScore(p);
				this._players[p._id] = { _life: p._life, _bikes: [], _size: p._size, _coords: p._coords };
			}
			this._injectBike(p);
		}, this);
		this._canvas.renderfix();
	},
	_injectBonuses: function(bonuses) {
		Object.each(bonuses, function(b){
			this._canvas.rect(b._coords.x*this.options.cellSize, b._coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: '#000', fill: '#000'});
			this._bonuses[b._id] = this._canvas.text(Math.floor(b._coords.x*this.options.cellSize+5), Math.floor(b._coords.y*this.options.cellSize+5), b._type).attr({'font-family': 'serif', 'font-weight': 'bold', 'font-size': '10'}).attr({'fill': '#fff'});
		}, this);
	},
	_injectBike: function(p) {
		if (p._life == 'dead' && this._players[p._id]._life != 'dead') {
			this._players[p._id]._life = 'dead';
			document.id('players').getElement('li[rel='+p._id+']').addClass('dead');
		}
		if (this._players[p._id]._bikes.length > p._size) {
			this._trimBike(p);
		}
		var fillColor = p._life == 'dead' ? p._color : 'white';
		if (p._current)
			this._players[p._id]._bikes.push(this._canvas.rect(p._current.x*this.options.cellSize, p._current.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor}));
		else 
		{
			Array.each(p._coords, function(coords) {
				this._players[p._id]._bikes.push(this._canvas.rect(coords.x*this.options.cellSize, coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor}));
			}, this);
		}
		//return this._canvas.rect(p._coords.x*this.options.cellSize, p._coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor});
	},
	_trimBike: function(p) {
		this._players[p._id]._bikes[0].remove();
		this._players[p._id]._bikes.shift();
		return this._players[p._id]._bikes.length > p._size ? this._trimBike(p) : true;
	},
	_injectScore: function(p) {
		if (this._players[p._id]) return;

		var ul = document.id('players');
		var li = new Element('li', {'rel': p._id}).inject(ul, p._id == this._player._id ? 'top': 'bottom');
		new Element('span', {'class': 'bullet', 'styles': {'border': '2px solid '+p._color}}).inject(li);
		new Element('span', {'class': 'name', 'html': p._name}).inject(li);
		if (p._life == 'dead') li.addClass('dead');
		if (p._id == this._player._id) li.addClass('you');
	}
})
