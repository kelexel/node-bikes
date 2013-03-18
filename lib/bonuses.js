var prime = require('prime')
, type = require('prime/type')
, string = require('prime/shell/string')
, number = require('prime/shell/number');

module.exports = prime({
	_type: false,
	_coords: false,
	_bonuses: false,
	_grid: false,
	_options: false,
	constructor: function(options) {
		this._options = options;
		this._bonuses = {};
		logger.debug('Bonuses instantiated')
	},
	getBonuses: function() {
		return this._bonuses;
	},
	getCoords: function(bid) {
		if (!this._bonuses[bid]) throw Error('Invalid bonus '+bid);
		return this._bonuses[bid]._coords;
	},
	add: function(bid, bAttr) {
		logger.debug('adding bonus '+bid, bAttr);
		this._bonuses[bid] = {'_id': bid, '_type': bAttr.type, '_coords': bAttr.coords};
	},
	del: function(bid) {
		logger.debug('removing bonus '+bid);
		delete this._bonuses[bid];
	},
	apply: function(bid, player) {
		// not working :(
		// emitter.emit('arena.removeBonus')
		if (!this._bonuses[bid]) throw Error('Invalid bonus');
		bonus = this._bonuses[bid];
		logger.debug('applying bonus '+bid+' to '+player.getId()+' ('+bonus._type+')');
		switch(bonus._type) {
			case '+': 
				var nsize = Math.round(player.getSize()+1);
				player.setSize(nsize);
				this._removeBonus(bid);
			break;
			case '-': 
				if (player.getSize() == 0) player.kill();
				else {
					var nsize = Math.round(player.getSize()-1);
					player.setSize(nsize);
				}
				this._removeBonus(bid);
			break;
			case 'x':
				player.kill();
			break;
			case '/':
				var s = Math.floor(string.number(player.getSize())/2);
				player.setSize(s);
			break;
			case 'z':
				player.setSize(0);
			break;
			case 'w':
				var cellSize = 10;
				player.setCoords({
					'x': number.random(1, Math.floor(this._options.size.x/cellSize)),
					'y': number.random(1, Math.floor(this._options.size.y/cellSize))
				});
			break;
			case '!':
				// player.popCoords();
				player.block();
			break;
			default:
				if (type(string.number(bonus._type)) == 'number') {
					var nsize = Math.round(player.getSize()+string.number(bonus._type));
					player.setSize(nsize);
					this._removeBonus(bid);
				}
			break;
		}
	},
	_removeBonus: function(bid) {
		logger.debug('should remove bonus');
		return this._emit('removeBonus', bid);
	},
	_emit: function(act, bid) {
		logger.debug('emitting '+act, bid);
		// not working :(
		_emitter.emit('arena.'+act, bid);
	}
});