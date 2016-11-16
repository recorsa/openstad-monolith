var _           = require('lodash')
  , express     = require('express')
  , compression = require('compression')
  , cors        = require('cors')
  , bodyParser  = require('body-parser');
var parseUrl    = require('url').parse;


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
		
		// Register middleware/routes, and start listening.
		require('./routes/')(this.app);
		this.app.listen(port, function() {
		  console.log('Server listening on port %s', port);
		});
	}
};