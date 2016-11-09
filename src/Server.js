var _           = require('lodash')
  , express     = require('express')
  , compression = require('compression')
  , cors        = require('cors')
  , bodyParser  = require('body-parser');
var parseUrl    = require('url').parse;

var RouteDefs   = require('./routes/');

module.exports  = {
	app: undefined,
	
	start: function( port ) {
		console.log('Starting server...');
		this.app = express();
		this.app.use(compression());
		this.app.use(cors());
		// this.app.use(bodyParser.json({
		// 	type: ['text', 'json']
		// }));
		
		this._registerRoutes();
		this._startServer(port);
	},
	
	_registerRoutes: function() {
		var server = this;
		
		_.forEach(RouteDefs, function( RouteDef ) {
			RouteDef.routes.forEach(function( def ) {
				if( !RouteDef[def.handler] ) {
					throw new Error('Route handler not found for `'+def.route+'`');
				}
				
				this.app[def.type](def.route, function( req, res ) {
					var controller = server._createController(req, res);
					RouteDef[def.handler](controller);
				});
			}, this);
		}.bind(this));
	},
	
	_startServer: function( port ) {
		this.app.listen(port, function() {
		  console.log('Server listening on port %s', port);
		});
	},
	
	_createController: function( req, res ) {
		var startTime = new Date();
		return {
			req    : req,
			res    : res,
			query  : parseUrl(req.url, true).query,
			params : req.params,
			body   : req.body,
			
			success: function( json ) {
				var ms = Date.now() - startTime.getTime();
				console.log('[%s] 200 (%sms): %s', startTime.toLocaleString(), ms, req.url);
				
				res.type('application/json');
				res.status(200);
				res.json(json || null);
			},
			error: function( msg, status ) {
				status || (status = 400);
				
				console.log('[%s] %s: %s', startTime.toLocaleString(), status, req.url);
				console.log('                          %s', (msg instanceof Object ? JSON.stringify(msg) : msg));
				res.type('application/json');
				res.status(status);
				res.json(msg instanceof Object ? msg : {error: msg});
			}
		};
	}
};