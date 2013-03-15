var prime = require('prime');
var object = require('prime/shell/object')
var array = require('prime/shell/array')
var type = require('prime/type');

var foo = prime({
	_coords: false,
	constructor: function(options) {
		this._coords = [{'x': 0, 'y': 0}];
		console.log(type(this._coords));
	},
	addCoords: function(coords) {
		this._coords.push(coords);
		this.dump();
	},
	dump: function() {
		console.log(this._coords);
	}
});

var world = prime({
	_obj: false,
	constructor: function(options) {
		this._obj = new foo();
	},
	addCoords: function(coords) {
		var blah = this._obj.addCoords.bind(this._obj, coords);
		blah();
	},
	dump: function() {
		console.log(this._coords);
	}
});

var hello = new world();
hello.addCoords({'x': 10, 'y': 30});