var config      = require('config')
var createError = require('http-errors')
var express     = require('express')
var Promise     = require('bluebird');

var util        = require('../../util')
var db          = require('../../db')
var auth        = require('../../auth');

module.exports = function( app ) {
	var router = express.Router();
	app.use('(/article|/artikel)', router);
	
	router.route('/:articleId(\\d+)')
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
	router.route('/create')
	.all(fetchAllArticles())
	.all(auth.can('article:create', true))
	.get(function( req, res, next ) {
		res.out('articles/form', true, {
			showForm        : req.can('article:create'),
			allArticles     : req.allArticles,
			useModernEditor : isModernBrowser(req),
			article         : { createdAt: Date.now() },
			csrfToken       : req.csrfToken()
		})
	})
	.post(function( req, res, next ) {
		req.body.location = JSON.parse(req.body.location || null);
		
		req.user.createNewArticle(req.body)
		.then(function( article ) {
			res.success('/article/'+article.id, {article: article});
		})
		.then(renumberArticles)
		.catch(function( error ) {
			if( error instanceof db.sequelize.ValidationError ) {
				error.errors.forEach(function( error ) {
					req.flash('error', error.message);
				});
				res.out('articles/form', false, {
					showForm        : true,
					useModernEditor : isModernBrowser(req),
					article         : req.body,
					allArticles     : req.allArticles,
					csrfToken       : req.csrfToken()
				});
			} else {
				next(error);
			}
		});
	});
	
	// Edit article
	// ------------
	router.route('/:articleId/edit')
	.all(fetchArticle('withPosterImage'))
	.all(fetchAllArticles())
	.all(auth.can('article:edit'))
	.get(function( req, res, next ) {
		res.out('articles/form', true, {
			article         : req.article,
			showForm        : true,
			allArticles     : req.allArticles,
			useModernEditor : isModernBrowser(req),
			csrfToken       : req.csrfToken()
		});
	})
	.put(function( req, res, next ) {
		req.user.updateArticle(req.article, req.body)
		.then(function( article ) {
			res.success('/article/'+article.id, {article: article});
		})
		.then(renumberArticles)
		.catch(function( error ) {
			if( error instanceof db.sequelize.ValidationError ) {
				error.errors.forEach(function( error ) {
					req.flash('error', error.message);
				});
				res.out('articles/form', false, {
					showForm        : true,
					useModernEditor : isModernBrowser(req),
					article         : req.article,
					allArticles     : req.allArticles,
					csrfToken       : req.csrfToken()
				});
			} else {
				next(error);
			}
		})
	});
	
	// Delete article
	// --------------
	router.route('/:articleId/delete')
	.all(fetchArticle())
	.all(auth.can('article:delete'))
	.delete(function( req, res, next ) {
		req.article.destroy()
		.then(function() {
			req.flash('success', 'Het artikel is verwijderd');
			res.success('/', true);
		})
		.catch(next);
	});

	// toggle article isPublished
	// --------------
	router.route('/:articleId/toggleIsPublished')
	.all(fetchArticle())
	.all(auth.can('article:edit'))
	.get(function( req, res, next ) {
		var article = req.article;
		article.update({isPublished: !article.isPublished})
		.then(function() {
			req.flash('success', article.isPublished ?
			                     'Het artikel is gepuliceerd' :
			                     'Het artikel niet langer gepuliceerd');
			res.success('/article/'+article.id, {article: article});
		})
		.catch(next);
	});

};

// TODO: gekopieerd uit idea, dus dit moet naar een lib
function isModernBrowser( req ) {
	var agent = util.userAgent(req.get('user-agent'));
	
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

function fetchAllArticles( req, res, next ) {
	return function( req, res, next ) {
		db.Article.getAllTiles()
		.then(articles => {
			req.allArticles = articles;
			next()
		})
		.catch(next);
	}
}

function renumberArticles() {
	return db.Article.getAllTiles()
	.then(articles => {
		var seqnr = 10;
		var updates = articles.map((article) => {
			return article.update({seqnr: article.seqnr + 10});
		});
		return Promise.all(updates);
	});
}