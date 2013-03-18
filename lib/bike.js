var colorspaces = require('colorspaces')
, prime = require('prime')
, array = require('prime/shell/array')
, number = require('prime/shell/number')
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
	_score: false, // holds the user's score
	_blocked: false,
	constructor: function(options) {
		if (!options || !options.id) throw Error('Invalid Id!');
		this._name = options.name;
		this._id = options.id;
		this._coords = [];
		this._life = 'young';
		this._color = colorspaces.make_color('sRGB', [number.random(0,80)/100, number.random(0,80)/100, number.random(0,80)/100]).as('hex');
		this._score = 0;
		this._size = 0;
		logger.debug('new bike loaded', this._id);
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
	getScore: function() {
		return this._score;
	},
	setScore: function(s, operator) {
		s = string.number(s);
		if (type(s) != 'number') throw Error('Invalid score!');
		if (operator)
			this._score = this._operator(this._score, s, operator);
		else
			this._score = s;
		return this;
	},
	getId: function() {
		return this._id;
	},
	getSize: function() {
		return this._size;
	},
	setSize: function(s, operator) {
		s = string.number(s);
		if (type(s) != 'number') throw Error('Invalid size!');

		if (operator){
			this._size = this._operator(this._size, s, operator);;
		}else
			this._size = s;
		return this;
	},
	getCoords: function() {
		return this._coords;
	},
	setCoords: function(coords) {
		this._coords.push(coords);
		return this;
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
	getColor: function() {
		return this._color;
	},
	getCompact: function() {
		return {
			'_id': this.getId(),
			'_current': this.getCurrentCoords(),
			'_size': this.getSize(),
			'_color': this.getColor(),
			'_life': this.isAlive(),
			'_score': this.getScore()
		};
	},
	_operator: function(int, s, operator) {
		int = !int ? 0 : int;
		if (operator && operator == '+')
			return Math.round(int + s);
		else if (operator && operator == '+')
			return Math.round(int - s);
		else if (operator && operator == '/') {
			return Math.floor(int / s);
		}else if (operator && operator == '*')
			return Math.round(int * s);
	}
});