	if (process.env.NODE_ENV == 'dev') {
		module.exports = {
			'logLevel': 'debug',
			'listenPort': 8888,
			'url_cdn': 'http://localhost:8888/assets/js',
			'url_socketio': 'http://localhost:8888'
		};
	} else {
		module.exports = {
			'logLevel': 'info',
			'listenPort': 8888,
			'url_cdn': 'http://bikesss.dune.org:8888/assets/js',
			'url_socketio': 'http://bikesss.dune.org:8888'
		}
	}
