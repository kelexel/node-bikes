var prime = require('prime');
var Emitter = require('prime/emitter');

var foo = prime({
	inherits: Emitter,
	_coords: false,
	constructor: function(options) {
		this.on('foobar', function() {
			console.log('foobar')
		});
		this.emit('foobar', false)
//		this._world = new world();
	},
	run: function() {
		this._world.run();
	},
	foobar: function(a) {
		console.log('foobar!');
	}
});

var world = prime({
	inherits: Emitter,
	run: function() {
		this.emit('foobar');
	}
});

var bar = new foo();
var bar2 = new world();
bar2.run();