var mysql    = require('mysql')
  , parseUrl = require('mysql/lib/ConnectionConfig').parseUrl;

var _poolCluster;

module.exports = {
	connect: function connect( config ) {
		if( _poolCluster ) {
			throw new Error('Already connected');
		}
		
		if( typeof config == 'string' ) {
			config = parseUrl(config);
		}
		config.connectionLimit = 5;
		config.queryFormat     = _queryFormat;
		
		_poolCluster = mysql.createPoolCluster({
			restoreNodeTimeout: 2000
		});
		_poolCluster.on('offline', function() {
			console.error('[ERROR] MySQL offline');
		});
		_poolCluster.on('online', function() {
			console.log('[INFO] MySQL online');
		});
		_poolCluster.add(config);
	},
	end: function() {
		_poolCluster.end();
	},
	
	query: function query( sql, vars ) {
		return new Promise(function( resolve, reject ) {
			_poolCluster.getConnection(function( error, connection ) {
				if( error ) {
					reject(error, this);
				} else {
					connection.query(sql, vars, function( error, result, fields ) {
						connection.release();
						if( error ) {
							reject(error, this);
						} else {
							resolve(result, fields, this);
						}
					});
				}
			});
		});
	}
};

// When supplying an array as values, use `?` and `??` as placeholders.
// In case of an object, use `:keyName` and `::keyName`.
function _queryFormat( sql, values ) {
	if( !values ) return sql;
	
	var conn = this;
	if( values instanceof Array ) {
		return mysql.format(sql, values, conn.config.stringifyObjects, conn.config.timezone);
	} else {
		return sql.replace(/(\:\:?)(\w+)/g, function( all, type, key ) {
			if( values.hasOwnProperty(key) ) {
				return type == '::' ?
				       mysql.escapeId(values[key]) :
				       conn.escape(values[key]);
			}
		});
	}
}