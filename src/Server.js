var _              = require('lodash')
  , config         = require('config')
  , express        = require('express')
  , compression    = require('compression')
  , cors           = require('cors')
  , bodyParser     = require('body-parser')
  , parseUrl       = require('url').parse
  , session        = require('express-session')
  , auth           = require('authorized');
var nunjucks       = require('nunjucks');
var util           = require('./util');

var SequelizeStore = require('connect-session-sequelize')(session.Store);
var db             = require('./db');

module.exports  = {
	app: undefined,
	
	start: function( port ) {
		console.log('Starting server...');
		this.app = express();
		this.app.use(compression());
		// this.app.use(cors());
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({extended: true}));
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
		
		nunjucks.configure('html', {
			watch   : config.get('debug'),
			express : this.app
		});
		
		// Initialize auth roles/entities
		require('./auth')(auth);
		// Register middleware/routes, and start listening.
		require('./routes')(this.app);
		require('./middleware/error_handling')(this.app);
		
		this.app.listen(port, function() {
		  console.log('Server listening on port %s', port);
		});
	}
};