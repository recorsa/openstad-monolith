var fs   = require('fs')
	, path = require('path');

var util = module.exports = {
	invokeDir: function( dirName, fn, ctx ) {
		dirName = util.relativePath(dirName);
		return _invokeDir(dirName, {}, fn, ctx);
	},
	
	relativePath: function( dirName ) {
		// Is `dirName` relative?
		if( path.normalize(dirName) !== path.resolve(dirName) ){
			// make `dirName` relative to the caller.
			var callerFilename = util.stack()[2].getFileName()
			  , callerPath     = path.dirname(callerFilename);
			dirName = path.resolve(callerPath, dirName);
		}
		return dirName;
	},
	
	stack: function _stackGrabber() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack) { return stack; };
		var err = new Error();
		Error.captureStackTrace(err, _stackGrabber);
		var errStack = err.stack;
		Error.prepareStackTrace = orig;
		return errStack;
	}
};

function _invokeDir( dirName, result, fn, ctx ) {
	require('fs').readdirSync(dirName).forEach(function( fileName ) {
		var fullPath = path.join(dirName, fileName)
			, isDir    = fs.lstatSync(fullPath).isDirectory()
			, name, file, fileResult;
		
		if( isDir ) {
			_invokeDir(fullPath, result, fn, ctx);
		} else if(
			fileName !== 'index.js' &&
			fileName.match(/\.js$/) !== null
		) {
			name = fileName.replace(/\.js$/, '');
			if( name in result ) {
				throw new Error('util.invokeDir panics on duplicate file names! ('+fullPath+')');
			}
			
			file       = require(fullPath);
			fileResult = fn.call(ctx || file, file, name, fullPath);
			if( fileResult !== undefined ) {
				result[name] = fileResult;
			}
		}
	});
	
	return result;
}