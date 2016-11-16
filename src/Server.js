var _              = require('lodash')
  , express        = require('express')
  , compression    = require('compression')
  , cors           = require('cors')
  , bodyParser     = require('body-parser')
  , parseUrl       = require('url').parse
  , session        = require('express-session');

var SequelizeStore = require('connect-session-sequelize')(session.Store);
var db             = require('./db');

module.exports  = {
	app: undefined,
	
	start: function( port ) {
		console.log('Starting server...');
		this.app = express();
		this.app.use(compression());
		// this.app.use(cors());
		// this.app.use(bodyParser.json({
		// 	type: ['text', 'json']
		// }));
		this.app.use(session({
			name              : 'amsterdam.sid',
			secret            : 'e56789!ouAr-/t8ewHDyer90_',
			proxy             : true, // Trust apache reverse proxy
			resave            : false,
			saveUninitialized : false,
			store: new SequelizeStore({
				db    : db.sequelize,
				table : 'session'
			}),
			cookie: {
				httpOnly          : true,
				secure            : false,
				maxAge            : 31536000000 // 1 year
			}
		}));
		
		// Register middleware/routes, and start listening.
		require('./routes/')(this.app);
		this.app.listen(port, function() {
		  console.log('Server listening on port %s', port);
		});
	}
};