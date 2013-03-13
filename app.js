// Use with something like:
//	env NODE_ENV='dev' node app.js
//	env NODE_ENV='prod' node app.js

var express = require('express')
, RedisStore = require('connect-redis')(express)
, sessionStore = new RedisStore()
, stylus = require('stylus')
, nib = require('nib')
, app = express()
, fs = require('fs')
, server = require('http').createServer(app)
, logger = require(__dirname+'/lib/logger.js')
, io = require('socket.io').listen(server,{
	// logger : logger
});

require('prime');
global._ = require(__dirname+'/lib/shell.js');
global._env = require(__dirname+'/lib/env.js');
global.logger = logger;

// CORS settings, passing * for now
app.all('*', function(req, res, next){
	if (!req.get('Origin')) return next();
	// use "*" here to accept any origin
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, POST');
	res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
	// res.set('Access-Control-Allow-Max-Age', 3600);
	if ('OPTIONS' == req.method) return res.send(200);
	next();
});

// just listen.
server.listen(8000);
logger.info('Starting Bikes Server');

function compile(str, path) {
	return stylus(str)
	.set('filename', path)
	.use(nib())
}

// express setup
app.configure(function() {
	// set an express cookie + session, not really used for now
	app.use(express.cookieParser());
	app.use(express.session({
		secret: 'helloworld',
		key: 'express.sid'
		// store: sessionStore
	}));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(app.router);
	// serve up static file if found
	app.engine('.html', require('jade').__express);

	app.use(stylus.middleware(
	{
		src: __dirname + '/public',
		compile: compile
	}
	));
	app.use('/', express.static(__dirname + '/public'));
	app.get('/', function (req, res) {
		res.render(
			'index',{
				title : 'Home' 
		});
	});
});

var dm = new (require(__dirname+'/lib/server.js'))(io, server);


