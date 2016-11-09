// Include all files in this folder.
require('fs').readdirSync(__dirname + '/').forEach(function( file ) {
  if(
  	file !== 'index.js' &&
  	file.match(/\.js$/) !== null
  ) {
    var name = file.replace('.js', '');
    exports[name] = require('./' + file);
  }
});