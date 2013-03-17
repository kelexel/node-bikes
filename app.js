// Use with something like:
//	env NODE_ENV='dev' node app.js
//	env NODE_ENV='prod' node app.js



var express = require('express')
, RedisStore = require('connect-redis')(express)
, connect = require('connect')
, stylus = require('stylus')
, nib = require('nib')
, app = express()
, fs = require('fs')
, server = require('http').createServer(app)
, logger = require(__dirname+'/lib/logger.js')
, io = require('socket.io').listen(server,{
	// logger : logger
})
, env = require(__dirname+'/lib/env.js');
require('prime');

// var redis = require('socket.io/lib/stores/redis');
// var pub = redis.createClient(env.redisPort, "http://localhost");
// var sub = redis.createClient(env.redisPort, "http://localhost");
// var store = redis.createClient(env.redisPort, "http://localhost");
// pub.auth('pass', function(){console.log("adentro! pub")});
// sub.auth('pass', function(){console.log("adentro! sub")});
// store.auth('pass', function(){console.log("adentro! store")});



var sessionStore = new connect.middleware.session.MemoryStore();
// var redisStore = require('connect-redis')(express);
// var sessionStore = new connect.middleware.session.RedisStore();
// var redisStore = new connect.middleware.session.RedisStore({redisPub:pub, redisSub:sub, redisClient:store});

global.logger = logger;

// io.set('authorization');


// CORS settings, passing * for now
app.all('*', function(req, res, next){
	if (!req.get('Origin')) return next();
	// use "*" here to accept any origin
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Credentials', true);
	res.set('Access-Control-Allow-Methods', 'GET, POST');
	res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
	// res.set('Access-Control-Allow-Max-Age', 3600);
	if ('OPTIONS' == req.method) return res.send(200);
	next();
});

// just listen.
if (!(env.listenPort)) throw Error('Something is wrong with lib/env.js !');

function compile(str, path) {
	return stylus(str)
	.set('filename', path)
	.use(nib())
}

// express setup
app.configure(function() {
	// set an express cookie + session, not really used for now
	app.use(express.cookieParser(env.sessionKey));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.session({ secret: env.sessionKey, store: sessionStore }));
	app.use(app.router);
	// serve up static file if found
	app.engine('.html', require('jade').__express);

	app.use(stylus.middleware(
	{
		src: __dirname + '/public',
		compile: compile
	}
	));

});
server.listen(env.listenPort);
logger.info('Starting BikeSss Server on port', env.listenPort);

	app.use('/', express.static(__dirname + '/public'));
	app.get('/', function (req, res) {
		res.render(
			'index',{
				title : 'Home',
				url_cdn: env.url_cdn,
				url_socketio: env.url_socketio
		});
	});

	io.configure(function() {
		io.enable('browser client etag');          // apply etag caching logic based on version number
		io.enable('browser client gzip');          // gzip the file	
		io.set('log level', 1);
//		io.set('store', redisStore);
	})
	.configure('prod', function () { 
		logger.info('Starting io in production mode');
		io.enable('browser client minification');
		io.enable('browser client gzip');          // gzip the file	
		io.enable('browser client etag');
		io.set('transports', ['websocket']);
	})
	.configure('dev', function(){
		logger.info('Starting io in developmment mode');
		io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
	});
	var ioSession = require('socket.io-session');
	io.set('authorization', ioSession(express.cookieParser(env.sessionKey), sessionStore));

var dm = new (require(__dirname+'/lib/server.js'))(io, server);


