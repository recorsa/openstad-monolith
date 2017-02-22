var ary           = require('lodash/ary');
var config        = require('config');
var Promise       = require('bluebird');
var nunjucks      = require('nunjucks');

var mail          = require('../mail');
var MemoryStore   = require('./MemoryStore');
var Notifications = require('./Notifications');
var Publication   = Notifications.Publication;

var notifications = new Notifications();

// Setup high-frequency admin email notifications.
var adminEmail = config.get('notifications.admin.emailAddress');
if( adminEmail ) {
	var pub = notifications.addPublication(new Publication('admin', new MemoryStore(), {
		assets: {
			'idea': [{
				events    : ['create', 'update'],
				frequency : 600 // 10 minutes
			}],
			'arg': [{
				events    : ['create', 'update'],
				frequency : 600
			}]
		},
		
		sendMessage: function( user ) {
			// HACK: The current file is included in some model definition
			//       files, so including db at the top of this files results
			//       in an empty object.
			var db = require('../db');
			
			if( user.id != 0 ) {
				throw Error('Only user 0 can be subscribed to this publication');
			}
			
			var queries = [];
			var assets  = user.assets;
			var data    = {
				date   : new Date(),
				assets : {}
			};
			
			// Gather data
			// -----------
			// Turn maps and sets into POJOs and arrays, get the relevant model instances
			// so they can be used by nunjucks to render the email content.
			assets.forEach(function( instances, assetName ) {
				var Model = assetName == 'idea' ? db.Idea.scope('withUser') :
				            assetName == 'arg'  ? db.Argument :
				                                  null;
				var rows  = data.assets[assetName] = [];
				
				instances.forEach(function( actions, instanceId ) {
					var row = {
						instance : undefined,
						action   : actions.has('create') ?
						           'created' :
						           'updated'
					};
					var query = Model.findById(instanceId).then(function( instance ) {
						row.instance = instance;
					});
					
					rows.push(row);
					queries.push(query);
				});
			});
			
			// When all data is fetched, render email and send it off.
			return Promise.all(queries)
			.then(function() {
				mail.sendMail({
					to          : adminEmail,
					subject     : 'Recente activiteit',
					html        : nunjucks.render('email/notifications_admin.njk', data),
					text        : 'Er hebben recent activiteiten plaatsgevonden op De Stem van West die mogelijk voor jou interessant zijn!',
					attachments : [{
						filename : 'logo@2x.png',
						path     : 'img/logo@2x.png',
						cid      : 'logo'
					}]
				});
				
				return null;
			});
		}
	}));
}

module.exports = notifications;