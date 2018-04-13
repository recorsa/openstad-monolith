var config      = require('config')
  , createError = require('http-errors')
  , express     = require('express')
  , Promise     = require('bluebird');
var util        = require('../../util')
  , db          = require('../../db')
  , auth        = require('../../auth');

module.exports = function( app ) {
	var router = express.Router();
	app.use('(/article|/artikel)', router);
	
	router.route('/:articleId')
  .all(fetchArticle('withPosterImage'))
	.all(auth.can('article:view', 'article:*'))
	.get(function( req, res, next ) {
		res.out('articles/article', true, {
			article: req.article,
			csrfToken : req.csrfToken()
		});
	});

	// Create article
	// --------------
	router.route('/:articleId/create')
	.all(fetchArticle('withPosterImage'))
	.all(auth.can('article:create'))
  .get(function( req, res, next ) {
		res.out('articles/form', true, {
			article: req.article,
			showForm        : false, // TODO: duh
			useModernEditor : isModernBrowser(req),
			csrfToken : req.csrfToken()
		})
	})
  .post(function( req, res, next ) {
		// get id, want die moeten over database incrementen
		// maak dan ook gelijk de dirs
		res.out('Moet nog');
	});
	
	// Edit article
	// ------------
	router.route('/:articleId/edit')
	.all(fetchArticle('withPosterImage'))
	.all(auth.can('article:edit'))
	.get(function( req, res, next ) {
		res.out('articles/form', true, {
			article: req.article,
			showForm        : false, // TODO: duh
			useModernEditor : isModernBrowser(req),
			csrfToken : req.csrfToken()
		});
	})
  .put(function( req, res, next ) {
		res.out('Moet nog');
	});
	
	// Delete article
	// --------------
	router.route('/:articleId/delete')
	.all(fetchArticle)
	.all(auth.can('article:delete'))
	.delete(function( req, res, next ) {
		var article = req.article;
		article.destroy()
		.then(function() {
			req.flash('success', 'Het artikel is verwijderd');
			res.success('/', true);
		})
		.catch(next);
	});

};

// TODO: gekopieerd uit idea, dus dit moet naar een lib
function isModernBrowser( req ) {
	var agent = util.userAgent(req.get('user-agent'));
	
	// console.log(agent);
	switch( agent.family.toLowerCase() ) {
		case 'android':
			return agent.satisfies('>= 4.4');
		case 'firefox':
			return agent.satisfies('>= 48');
		case 'chrome':
			return agent.satisfies('>= 53');
		case 'ie':
			return agent.satisfies('>= 11');
		case 'edge':
			return true;
		case 'safari':
			return agent.satisfies('>= 8');
		case 'mobile safari':
			return agent.satisfies('>= 8.4');
		default:
			return false;
	}
}

function fetchArticle( req, res, next ) {
	var scopes = Array.from(arguments);
	return function( req, res, next ) {
    var articleId = req.params.articleId;
		db.Article.scope(scopes).findById(articleId)
		  .then(function( article ) {
			if( !article ) {
				next(createError(404, 'Artikel niet gevonden'));
			} else {
				req.article = article;
				next();
			}
		})
		.catch(next);
	}
}
