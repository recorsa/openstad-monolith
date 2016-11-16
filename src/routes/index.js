module.exports = function( app ) {
	require('fs').readdirSync(__dirname + '/').forEach(function( file ) {
	  if(
	  	file !== 'index.js' &&
	  	file.match(/\.js$/) !== null
	  ) {
	    // var name = file.replace('.js', '');
	    require('./' + file)(app);
	  }
	});
};