var prime = require('prime');

module.exports = prime({
	_coords: {x: 0, y: 0},
	_id : false,
	_name: false,
	_course: false,
	_life: false,
	constructor: function(options) {
		if (!options || !options.id) throw Error('Invalid Id!');
		this._name = options.name;
		this._id = options.id;
		this._life = 'young';
		this._color = '#'+Math.floor(Math.random()*16777215).toString(16);
		logger.debug('new bike loaded', this._id);
	},
	kill: function() {
		this._life = 'dead';
	},
	setCourse: function(course) {
		this._course = course;
		return this;
	},
	setCoords: function(coords) {
		this._coords = coords;
		return this;
	},
	getId: function() {
		return this._id;
	},
	getCoords: function() {
		return this._coords;
	},
	getName: function() {
		return this._name;
	},
	getCourse: function() {
		return this._course;
	},
	isAlive: function() {
		return this._life == 'dead' ? false : true;
	}
});