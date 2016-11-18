module.exports = function( auth ) {
	auth.action('view idea', ['idea.owner']);
};