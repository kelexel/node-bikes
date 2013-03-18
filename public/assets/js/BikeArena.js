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
	_arenaState: 'lobby',
	_gameTimer: {el: false, value: false, instance: false, max: false},
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
			// _companyGameOver: this._companyGameOver.bind(this),
			_companyNewPlayer: this._companyNewPlayer.bind(this),
			_companyRemoveBonus: this._companyRemoveBonus.bind(this),
			_companyState: this._companyState.bind(this)
		}
		this._form.addEvent('click:relay(button.submit)', this._bound._eventClickEnroll);
		document.id('insertCoin').addEvent('click', this._bound._eventClickInsertCoin);
		window.addEvent('keydown', this._bound._eventKeydown);
		this.subscribe('Arena.welcome', this._bound._companyWelcome);
		this.subscribe('Arena.move', this._bound._companyMove);
		this.subscribe('Arena.newPlayer', this._bound._companyNewPlayer);
		// this.subscribe('Arena.gameOver', this._bound._companyGameOver);
		this.subscribe('Arena.removeBonus', this._bound._companyRemoveBonus);
		this.subscribe('Arena.state', this._bound._companyState);
	},
	_eventClickEnroll: function(e, el) {
		e.stop();
		if (this._form.validate()) {
			var name = document.id('f_playerName').get('value');
			_i['socket'] = new BikeSocket({'socketUrl': this.options.socketUrl, 'name': name});
			this._form.addClass('hidden');
		}
	},
	_eventClickInsertCoin: function(e, el) {
		e.stop();
		if (this._arenaState != 'running') return;
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
		if (this._arenaState != 'running') return;
		this.copublish('emit', ['move', keys[e.code], false]);
	},
	_companyWelcome: function(payload) {
		this._gridInit(payload.arena);
		document.id('players').set('html', '');
		this._player = payload.player;
		this._playersInit(payload.players);
		this._injectBonuses(payload.bonuses);
		this._companyState(payload.state);
		if (payload.log) this._log(payload.log);
	},
	_companyNewPlayer: function(payload) {
		var newPlayer = payload.newPlayer;
		if (newPlayer._id == this._player._id) return;
		this._players[newPlayer._id] = { _life: newPlayer._life, _bikes: [], _size: newPlayer._size, _coords: newPlayer._coords };
		this._injectScore(newPlayer);
		// this._players[payload.newPlayer._id] = true;
		this._injectBike(payload.newPlayer);
	},
	_companyMove: function(payload) {
		// console.log('move', payload)
		this._injectBike(payload.player);
		this._updateScore(payload.player);
	},
	_checkGameOver: function(payload) {
		if (payload.state != 'gameOver') return;
		if (payload.log) {
			this._log(payload.log, 10);
			alert(payload.log);
		}
		document.id('insertCoin').removeClass('hidden');
	},
	_companyRemoveBonus: function(payload) {
		var bSize = {'x': this._bonuses[payload.bonus].attr('x'), 'y': this._bonuses[payload.bonus].attr('y') };
		var nT = this._canvas.text(bSize.x, bSize.y, '!').attr({'font-family': 'serif', 'font-weight': 'bold', 'font-size': '10'}).attr({'fill': '#fff'});
		nT.insertAfter(this._bonuses[payload.bonus]);
		this._bonuses[payload.bonus].remove();
	},
	_companyState: function(payload) {
		// console.log('_companyState payload', payload)
		if (payload.state == 'running' && payload.timer) {
			if (payload.log) this._log(payload.log, 3);
			this._setTimerPeriodical(payload.timer);
			this._arenaState = 'running';
		} else if (payload.state == 'gameOver') {
			// console.log('received gameOver')
			this._checkGameOver(payload);
		} else {
			// console.log('timer not started')
			this._arenaState = payload.state;
		}
	},
	_setTimerPeriodical: function(time) {
		if (this._gameTimer.instance) clearTimeout(this._gameTimer.instance);
		// console.log('using time', time);
		time = time - Math.floor(Date.now() / 1000) + 900;
		// console.log('starting timer at ', time)
		this._gameTimer.value = time.toInt();
		this._gameTimer.instance = this._decreaseTimer.periodical(1000, this);
	},
	_decreaseTimer: function() {
		this._gameTimer.value--;
		this._gameTimer.el.set('html', this._gameTimer.value);
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

		this._gameTimer.el = document.id('status').getElement('span.counter em').set('html', options.gameTime);
		this._gameTimer.value = options.gameTime.toInt();
		this._gameTimer.max = options.gameTime.toInt();
		// console.log('megadebug', options)
		return this;
	},
	_playersInit: function(players) {
		Object.each(players, function(p) {
			if (!p._id && console && console.log) console.log('Invalid p._id!', p);
			if (!this._players[p._id]) {
				this._players[p._id] = { _life: p._life, _bikes: [], _size: p._size, _coords: p._coords, _scoreBoard: false, _score: p._score};
				this._injectScore(p);
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
		if (!p._life && this._players[p._id]._life) {
			this._players[p._id]._life = false;
			document.id('players').getElement('li[rel='+p._id+']').addClass('dead');
		}
		if (this._players[p._id]._bikes.length > p._size) {
			this._trimBike(p);
		}
		var fillColor = !p._life  ? '#000' : p._color;
		// var strokeColor = p._color;
		var strokeColor = '#000';
		if (p._current)
			this._players[p._id]._bikes.push(this._canvas.rect(p._current.x*this.options.cellSize, p._current.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: strokeColor, fill: fillColor}));
		else 
		{
			Array.each(p._coords, function(coords) {
				this._players[p._id]._bikes.push(this._canvas.rect(coords.x*this.options.cellSize, coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: strokeColor, fill: fillColor}));
			}, this);
		}
		//return this._canvas.rect(p._coords.x*this.options.cellSize, p._coords.y*this.options.cellSize, this.options.cellSize, this.options.cellSize).attr({stroke: p._color, fill: fillColor});
	},
	_updateScore: function(p) {
		// console.log('_updateScore recieved', p)
		// console.log('scoreboard', this._players[p._id]._scoreBoard, p._score)
		this._players[p._id]._scoreBoard.set('html', p._score);
	},
	_trimBike: function(p) {
		this._players[p._id]._bikes[0].remove();
		this._players[p._id]._bikes.shift();
		return this._players[p._id]._bikes.length > p._size ? this._trimBike(p) : true;
	},
	_injectScore: function(p) {
		if (this._players[p._id]._scoreBoard) return;

		var ul = document.id('players');
		var li = new Element('li', {'rel': p._id}).inject(ul, p._id == this._player._id ? 'top': 'bottom');
		var s = new Element('span', {'class': 'score', 'html': 'score: '}).inject(li);
		this._players[p._id]._scoreBoard = new Element('em', {'html': p._score}).inject(s);
		new Element('span', {'class': 'bullet', 'styles': {'border': '2px solid '+p._color}}).inject(li);
		new Element('span', {'class': 'name', 'html': p._name}).inject(li);
		if (!p._life) li.addClass('dead');
		if (p._id == this._player._id) {
			li.addClass('you');
			if (!p._life) document.id('insertCoin').removeClass('hidden');
		}
	},
	_log: function(str, time) {
		document.id('arenaLog').set('html', str);
		if (!time) return;
		(function() {
			// console.log('clearing log');
			document.id('arenaLog').set('html', '' );
		}).delay(time*1000);
	}
})
