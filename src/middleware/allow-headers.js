const config = require('config');

module.exports = function( req, res, next ) {

	// TODO: make it configurable
  res.header('Access-Control-Allow-Origin', config.url || ( req.protocol + '://' + req.hostname ));
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, x-http-method-override, X-GRIP-Tenant-Id');

	if (req.method == 'OPTIONS') {
		return res.end();
	}

	return next();

}
