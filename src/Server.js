var _                  = require('lodash')
  , compression        = require('compression')
  , config             = require('config')
  , cors               = require('cors')
  , express            = require('express')

// Misc
var util               = require('./util');
var log                = require('debug')('app:http');

module.exports  = {
	app: undefined,
	
	start: function( port ) {
		log('initializing...');
		this.app = express();
		this.app.disable('x-powered-by');
		this.app.set('trust proxy', true);
		this.app.set('view engine', 'njk');
		this.app.use(compression());
		// this.app.use(cors());
		
		// Register statics first...
		this._initStatics();
		
		// ... then middleware everyone needs...
		this._initBasicMiddleware();
		this._initSessionMiddleware();
		this._initRenderMiddleware();
		
		// ... then the upload functionality (not compatible with CSRF)...
		require('./routes/media_upload')(this.app);
		
		// ... security middleware (CSRF)...
		this._initSecurityMiddleware();
		
		// ... little helper middlewares...
		require('./middleware/fullhost')(this.app);
		require('./middleware/multi_accept')(this.app);
		require('./middleware/force_registration')(this.app);
		this.app.use(require('./middleware/nocache'));
		// ... routes...
		require('./routes/ab')(this.app);
		require('./routes/account')(this.app);
		require('./routes/article')(this.app);
		require('./routes/default')(this.app);
		require('./routes/dev')(this.app);
		require('./routes/help')(this.app);
		require('./routes/idea')(this.app);
		// ... and error handlers always last.
		require('./middleware/error_handling')(this.app);
		
		this.app.listen(port, function() {
		  log('listening on port %s', port);
		});
	},
	
	_initStatics: function() {
		var less = require('less-middleware');
		
		// Requires custom change to less:
		// https://github.com/less/less.js/pull/2866/files
		// 
		// Current release is 2.7.1, newer release should have a fix for
		// the 'octals in strict mode' problem.
		this.app.use('/css', less('css', {
			render: {
				compress   : !config.get('debug'),
				strictMath : true
			}
		}));
		this.app.use('/css', express.static('css'));
		
		this.app.use('/fonts', express.static('fonts', {
			setHeaders: function( res ) {
				res.type('application/font-woff');
			}
		}));
		
		this.app.use('/img', express.static('img'));
		this.app.use('/js',  express.static('js'));
		this.app.use('/lib',  express.static('lib'));
		
		require('./routes/media_get')(this.app);
	},
	_initBasicMiddleware: function() {
		var bodyParser         = require('body-parser')
		var methodOverride     = require('method-override')
		
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({extended: true}));
		this.app.use(methodOverride(function( req, res ) {
			var method;
			if( req.body && req.body instanceof Object && '_method' in req.body ) {
				method = req.body._method;
				delete req.body._method;
			} else {
				method = req.get('X-HTTP-Method') ||
				         req.get('X-HTTP-Method-Override') ||
				         req.get('X-Method-Override');
			}
			if( method ) {
				log('method override: '+method);
			}
			return method;
		}));
	},
	_initSessionMiddleware: function() {
		// Session management
		// ------------------
		var flash          = require('connect-flash');
		var session        = require('express-session');
		var SequelizeStore = require('connect-session-sequelize')(session.Store);
		var db             = require('./db');
		this.app.use(session({
			name              : 'amsterdam.sid',
			secret            : config.get('security.sessions.secret'),
			proxy             : true, // Trust apache reverse proxy
			resave            : false,
			unset             : 'destroy',
			saveUninitialized : false,
			store: new SequelizeStore({
				db    : db.sequelize,
				table : 'session'
			}),
			cookie: {
				httpOnly : true,
				secure   : false,
				maxAge   : 31536000000 // 1 year
			}
		}));
		// Middleware to fill `req.user` with a `User` instance.
		require('./middleware/session_user')(this.app);
		// Support for flash messages.
		this.app.use(flash());
	},
	_initSecurityMiddleware: function() {
		var csurf = require('csurf');
		// `csurf` makes non-GET requests require a CSRF token. Use `req.csrfToken()`
		// in form-rendering GET request in order to send the correct token.
		// 
		// TODO: Always sets a cookie for a user-specific token secret. Rewrite to use
		//       in-memory store?
		this.app.use(csurf());
		// this.app.use(function( req, res, next ) {
		// 	req.csrfToken = function() { return '' };
		// 	next();
		// });
	},
	_initRenderMiddleware: function() {
		var moment     = require('moment-timezone');
		var nunjucks   = require('nunjucks');
		var dateFilter = require('./nunjucks/dateFilter');
		var duration   = require('./nunjucks/duration');
		
		var env = nunjucks.configure('html', {
			express    : this.app,
			watch      : false,
			autoescape : true
		});
		
		dateFilter.setDefaultFormat('DD-MM-YYYY HH:mm');
		env.addFilter('date', dateFilter);
		env.addFilter('duration', duration);
	}
};