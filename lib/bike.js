var prime = require('prime');
var object = require('prime/shell/object')
var array = require('prime/shell/array')
var type = require('prime/type');

module.exports = prime({
	_coords: false,	// coordinates place holder, should be a bloody array
	_id : false,	// playerId
	_name: false,	// playerName
	_course: false,	// course (u,d,l,r)
	_life: false,	// 'young', 'dead'
	_color: false,	// user's bike color
	_size: false, // the permitted bike size
	constructor: function(options) {
		if (!options || !options.id) throw Error('Invalid Id!');
		this._name = options.name;
		this._id = options.id;
		this._coords = [];
		console.log(type(this._coords));
		this._life = 'young';
		this._color = '#'+Math.floor(Math.random()*16777215).toString(16);
		logger.debug('new bike loaded', this._id);
		this._size = 1;
	},
	kill: function() {
		this._life = 'dead';
	},
	setCourse: function(course) {
		this._course = course;
		return this;
	},
	setCoords: function(coords) {
		// if (array.count(this._coords) > this._length) this._coords.shift();
console.log('-- before ', this._coords)
console.log('-type '+type(this._coords));
console.log('---adding ', coords)
console.log('-type '+type(coords));
this._coords.push(coords);
console.log('--afterpush ', this._coords)
console.log('--type '+type(this._coords));
		return this;
	},
	getId: function() {
		return this._id;
	},
	getCoords: function() {
		return this._coords;
	},
	getLastCoords: function() {
		var k = array.count(this._coords)-1;
		// var k = 0;
		logger.debug('current array key', k)
		return this._coords[k];
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
	getCompact: function() {
		return {
			'_id': this._id,
			'_current': this.getLastCoords(),
			'_size': this._size,
			'_color': this._color,
			'_life': this._life
		};
	}
});