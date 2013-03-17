var prime = require('prime')
, array = require('prime/shell/array')
, string = require('prime/shell/string')
, type = require('prime/type');

module.exports = prime({
	_coords: false,	// coordinates place holder, should be a bloody array
	_id : false,	// playerId
	_name: false,	// playerName
	_course: false,	// course (u,d,l,r)
	_life: false,	// 'young', 'dead'
	_color: false,	// user's bike color
	_size: false, // the permitted bike size
	_drunk: false, // very bad idea
	_blocked: false,
	constructor: function(options) {
		if (!options || !options.id) throw Error('Invalid Id!');
		this._name = options.name;
		this._id = options.id;
		this._coords = [];
		this._life = 'young';
		this._color = '#'+Math.floor(Math.random()*16777215).toString(16);
		logger.debug('new bike loaded', this._id);
		this._size = 0;
	},
	kill: function() {
		this._life = 'dead';
	},
	setCourse: function(course) {
		this._course = course;
		return this;
	},
	getCourse: function() {
		return this._course;
	},
	setCoords: function(coords) {
		// if (array.count(this._coords) > this._length) this._coords.shift();
		this._coords.push(coords);
		return this;
	},
	getId: function() {
		return this._id;
	},
	getSize: function() {
		return this._size;
	},
	getCoords: function() {
		return this._coords;
	},
	getCurrentCoords: function() {
		var k = array.count(this._coords)-1;
		return this._coords[k];
	},
	getOldestCoords: function() {
		return this._coords[0];
	},
	getName: function() {
		return this._name;
	},
	getCourse: function() {
		return this._course;
	},
	isAlive: function() {
		return this._life == 'dead' ? false : true;
	},
	isOversized: function() {
		return array.count(this._coords) > this._size ? true : false;
	},
	shiftCoords: function() {
		this._coords.shift();
		return this;
	},
	popCoords: function() {
		this._coords.pop();
		return this;
	},
	block: function() {
		this._blocked = true;
	},
	unblock: function() {
		this._blocked = false;
	},
	isBlocked: function() {
		var r = this._blocked;
		return r;
	},
	getCompact: function() {
		return {
			'_id': this._id,
			'_current': this.getCurrentCoords(),
			'_size': this._size,
			'_color': this._color,
			'_life': this._life
		};
	},
	setSize: function(s) {
		s = string.number(s);
		if (type(s) != 'number') throw Error('Invalid size!');
		this._size = s;
		return this;
	}
});