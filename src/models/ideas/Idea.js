var co            = require('co')
  , config        = require('config')
  , moment        = require('moment-timezone')
  , pick          = require('lodash/pick')
  , Promise       = require('bluebird');

var sanitize      = require('../../util/sanitize');
var ImageOptim    = require('../../ImageOptim');
var notifications = require('../../notifications');

var argVoteThreshold = config.get('ideas.argumentVoteThreshold');

var summaryMaxLength = config.ideas.summaryMaxLength || 140;

module.exports = function( db, sequelize, DataTypes ) {
	var Idea = sequelize.define('idea', {
		siteId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		meetingId: {
			type         : DataTypes.INTEGER,
			allowNull    : true
		},
		userId: {
			type         : DataTypes.INTEGER,
			allowNull    : false
		},
		startDate: {
			type         : DataTypes.DATE,
			allowNull    : false
		},
		endDate: {
			type         : DataTypes.DATE,
			allowNull    : true
		},
		duration: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				if( this.getDataValue('status') != 'OPEN' ) {
					return 0;
				}

				var now     = moment();
				var endDate = this.getDataValue('endDate');
				return Math.max(0, moment(endDate).diff(Date.now()));
			}
		},
		sort: {
			type         : DataTypes.INTEGER,
			allowNull    : false,
			defaultValue : 1
		},
		status: {
			type         : DataTypes.ENUM('OPEN','CLOSED','ACCEPTED','DENIED','BUSY','DONE'),
			defaultValue : 'OPEN',
			allowNull    : false
		},
		title: {
			type         : DataTypes.STRING(255),
			allowNull    : false,
			validate     : {
				len: {
					args : [10,summaryMaxLength],
					msg  : `Titel moet tussen 10 en ${summaryMaxLength} tekens lang zijn`
				}
			},
			set          : function( text ) {
				this.setDataValue('title', sanitize.title(text.trim()));
			}
		},
		posterImageUrl: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				var posterImage = this.get('posterImage');
				var location    = this.get('location');

				if ( Array.isArray(posterImage) ) {
					posterImage = posterImage[0];
				}

				// temp, want binnenkort hebben we een goed systeem voor images
				let imageUrl = config.url || '';
				
				return posterImage ? `${imageUrl}/image/${posterImage.key}?thumb` :
				       location    ? 'https://maps.googleapis.com/maps/api/streetview?'+
				                     'size=800x600&'+
				                     `location=${location.coordinates[0]},${location.coordinates[1]}&`+
				                     'heading=151.78&pitch=-0.76&key=' + config.openStadMap.googleKey
				                   : null;
			}
		},
		summary: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			validate     : {
				len: {
					args : [20,summaryMaxLength],
					msg  : `Samenvatting moet tussen 20 en ${summaryMaxLength} tekens zijn`
				}
			},
			set          : function( text ) {
				this.setDataValue('summary', sanitize.summary(text.trim()));
			}
		},
		description: {
			type         : DataTypes.TEXT,
			allowNull    : false,
			validate     : {
				len: {
					args : [140,],
					msg  : 'Beschrijving moet minimaal 140 tekens lang zijn'
				}
			},
			set          : function( text ) {
				this.setDataValue('description', sanitize.content(text.trim()));
			}
		},

		extraData: {
			type         : DataTypes.JSON,
			allowNull    : false,
			defaultValue : {},
			get          : function() {
				// for some reaason this is not always done automatically
				let value = this.getDataValue('extraData');
        try {
					if (typeof value == 'string') {
						value = JSON.parse(value);
					}
				} catch(err) {}
				return value;
			},
			set: function(value) {
        try {
					if (typeof value == 'string') {
						value = JSON.parse(value);
					}
				} catch(err) {}
				let newValue = {};
				let configExtraData = config.ideas && config.ideas.extraData;
				Object.keys(configExtraData).forEach((key) => {
					if (configExtraData[key].allowNull === false && typeof value[key] === 'undefined') { // TODO: dit wordt niet gechecked als je het veld helemaal niet meestuurt
						throw Error(`${key} is niet ingevuld`);
					}
					if (value[key] && configExtraData[key].values.indexOf(value[key]) != -1) { // TODO: alles is nu enum, maar dit is natuurlijk veel te simpel
						newValue[key] = value[key];
					}
				});
				this.setDataValue('extraData', newValue);
			}
		},

		location: {
			type         : DataTypes.GEOMETRY('POINT'),
			allowNull    : !config.get('ideas.location.isMandatory'),
		},

		position: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				var location    = this.get('location');
				var position;
				if (location && location.type && location.type == 'Point') {
					position = {
						lat: location.coordinates[0],
						lng: location.coordinates[1],
					};
				}
				return position
			}
		},

		modBreak: {
			type         : DataTypes.TEXT,
			allowNull    : true,
			set          : function( text ) {
				this.setDataValue('modBreak', sanitize.content(text));
			}
		},
		modBreakUserId: {
			type         : DataTypes.INTEGER,
			allowNull    : true
		},
		modBreakDate: {
			type         : DataTypes.DATE,
			allowNull    : true
		},
		// Counts set in `summary`/`withVoteCount` scope.
		no: {
			type         : DataTypes.VIRTUAL
		},
		yes: {
			type         : DataTypes.VIRTUAL
		},
		progress: {
			type         : DataTypes.VIRTUAL,
			get          : function() {
				var minimumYesVotes = config.get('ideas.minimumYesVotes');
				var yes             = this.getDataValue('yes');
				return yes !== undefined ?
				       Number((Math.min(1, (yes / minimumYesVotes)) * 100).toFixed(2)) :
				       undefined;
			}
		},
		argCount: {
			type         : DataTypes.VIRTUAL
		}
	}, {
		hooks: {
			beforeValidate: co.wrap(function*( idea, options ) {
				// Automatically determine `endDate`
				if( idea.changed('startDate') ) {
					var duration = config.get('ideas.duration');
					var endDate  = moment(idea.startDate).add(duration, 'days').toDate();
					idea.setDataValue('endDate', endDate);
				}
			})
		},
		validate: {
			validDeadline: function() {
				if( this.endDate - this.startDate < 43200000 ) {
					throw Error('An idea must run at least 1 day');
				}
			},
			validModBreak: function() {
				if( this.modBreak && (!this.modBreakUserId || !this.modBreakDate) ) {
					throw Error('Incomplete mod break');
				}
			}
		},
		classMethods: {
			scopes: scopes,

			associate: function( models ) {
				this.belongsTo(models.Meeting);
				this.belongsTo(models.User);
				this.hasMany(models.Vote);
				this.hasOne(models.Vote, {as: 'userVote', });
				this.hasMany(models.Argument, {as: 'argumentsAgainst'});
				this.hasMany(models.Argument, {as: 'argumentsFor'});
				this.hasMany(models.Image);
				this.hasMany(models.Image, {as: 'posterImage'});
				this.hasOne(models.Poll);
				this.hasMany(models.AgendaItem, {as: 'agenda'});
			},

			getHighlighted: function() {
				return this.scope('summary').findAll({
					where : {status: 'OPEN'},
					order : 'sort, endDate DESC',
					limit : 3
				});
			},

			// deze bestaat voor de oude sites; de api gebruikt hier scopes voor
			getRunning: function( sort, options ) {
				var order;
				switch( sort ) {
					case 'votes_desc':
						order = 'yes DESC';
						break;
					case 'votes_asc':
						order = 'yes ASC';
						break;
					case 'date_asc':
						order = 'endDate ASC';
						break;
					case 'date_desc':
					default:
						order = `
							CASE status
								WHEN 'ACCEPTED' THEN 4
								WHEN 'OPEN'     THEN 3
								WHEN 'BUSY'     THEN 2
								WHEN 'DENIED'   THEN 0
								                ELSE 1
							END DESC,
							endDate DESC
						`;
				}

				let where = {
						$or: [
							{
								status: {$in: ['OPEN', 'CLOSED', 'ACCEPTED', 'BUSY', 'DONE']}
							}, {
								$and: [
									{status: {$not: 'DENIED'}},
									sequelize.where(db.Meeting.rawAttributes.date, '>=', new Date())
								]
							}, {
								$and: [
									{status: 'DENIED'},
									sequelize.literal(`DATEDIFF(NOW(), idea.updatedAt) <= 7`)
								]
							}
						]
				};

				// todo: dit kan mooier
				if (options && options.siteId) {
					where = {
						$and: [
							{ siteId: options.siteId },
							{ $or: where.$or },
						]
					}
				}

				// Get all running ideas.
				// TODO: Ideas with status CLOSED should automatically
				//       become DENIED at a certain point.
				return this.scope('summary', 'withPosterImage').findAll({
					where: where,
					order   : order,
					include : [{
						model: db.Meeting,
						attributes: []
					}]
				}).then((ideas) => {
					// add ranking
					let ranked = ideas.slice();
					ranked.forEach(idea => {
						idea.ranking = idea.status == 'DENIED' ? -10000 : idea.yes - idea.no;
					});
					ranked.sort( (a, b) => b.ranking - a.ranking );
					let rank = 1;
					ranked.forEach(idea => {
						idea.ranking = rank;
						rank++;
					});
					return sort == 'ranking' ? ranked : ideas;
				});
			},
			getHistoric: function() {
				return this.scope('summary').findAll({
					where: {
						status: {$notIn: ['OPEN', 'CLOSED']}
					},
					order: 'updatedAt DESC'
				});
			}
		},
		instanceMethods: {
			getUserVote: function( user ) {
				return db.Vote.findOne({
					attributes: ['opinion'],
					where: {
						ideaId : this.id,
						userId : user.id
					}
				});
			},
			isOpen: function() {
				return this.status === 'OPEN';
			},
			isRunning: function() {
				return this.status === 'OPEN'     ||
				       this.status === 'CLOSED'   ||
				       this.status === 'ACCEPTED' ||
				       this.status === 'BUSY'
			},

			addUserVote: function( user, opinion, ip, extended ) {
				var data = {
					ideaId  : this.id,
					userId  : user.id,
					ip      : ip
				};

				let found = false;
				return db.Vote.findOne({where: data})
				.then(function( vote ) {
					if (vote) {
						found = true;
					}
					if( vote && vote.opinion === opinion ) {
						return vote.destroy();
					} else {
						// HACK: `upsert` on paranoid deleted row doesn't unset
						//        `deletedAt`.
						// TODO: Pull request?
						data.deletedAt = null;
						data.opinion = opinion;
						return db.Vote.upsert(data);
					}
				})
				.then(function( result ) {
					if (extended) {
						// nieuwe versie, gebruikt door de api server
						if (found) {
							if (result && !!result.deletedAt) {
								return 'cancelled';
							} else {
								return 'replaced';
							}
						} else {
							return 'new';
						}
					} else {
						// oude versie
						// When the user double-voted with the same opinion, the vote
						// is removed: return `true`. Otherwise return `false`.
						//
						// `vote.destroy` returns model when `paranoid` is `true`.
						return result && !!result.deletedAt;
					}
				});
			},

			addUserArgument: function( user, data ) {
				var filtered = pick(data, ['parentId', 'confirmationRequired', 'sentiment', 'description', 'label']);
				filtered.ideaId = this.id;
				filtered.userId = data.userId || user.id;
				return db.Argument.create(filtered)
					.tap(function( argument ) {
						if (!data.confirmationRequired) {
							notifications.trigger(user.id, 'arg', argument.id, 'create');
						}
				});
			},
			updateUserArgument: function( user, argument, description ) {
				return argument.update({
					description: description
				})
				.tap(function( argument ) {
					notifications.trigger(user.id, 'arg', argument.id, 'update');
				});
			},

			setModBreak: function( user, modBreak ) {
				return this.update({
					modBreak       : modBreak,
					modBreakUserId : user.id,
					modBreakDate   : new Date()
				});
			},
			setStatus: function( status ) {
				return this.update({status: status});
			},
			setMeetingId: function( meetingId ) {
				meetingId = ~~meetingId || null;
				
				return db.Meeting.findById(meetingId)
				.bind(this)
				.tap(function( meeting ) {
					if( !meetingId ) {
						return;
					} else if( !meeting ) {
						throw Error('Vergadering niet gevonden');
					} else if( meeting.finished ) {
						throw Error('Vergadering ligt in het verleden');
					} else if( meeting.type == 'selection' ) {
						throw Error('Agenderen op een peildatum is niet mogelijk');
					}
				})
				.then(function() {
					return this.update({meetingId});
				});
			},

			updateImages: function( imageKeys ) {
				var self = this;
				if( !imageKeys || !imageKeys.length ) {
					imageKeys = [''];
				}

				var ideaId  = this.id;
				var queries = [
					db.Image.destroy({
						where: {
							ideaId : ideaId,
							key    : {$notIn: imageKeys}
						}
					})
				].concat(
					imageKeys.map(function( imageKey, sort ) {
						return db.Image.update({
							ideaId : ideaId,
							sort   : sort
						}, {
							where: {key: imageKey}
						});
					})
				);

				return Promise.all(queries).then(function() {
					ImageOptim.processIdea(self.id);
					return self;
				});
			}
		}
	});

	function scopes() {
		// Helper function used in `withVoteCount` scope.
		function voteCount( opinion ) {
			return [sequelize.literal(`
				(SELECT
					COUNT(*)
				FROM
					votes v
				WHERE
					v.deletedAt IS NULL AND (
						v.checked IS NULL OR
						v.checked  = 1
					) AND
					v.ideaId     = idea.id AND
					v.opinion    = "${opinion}")
			`), opinion];
		}
		function argCount( fieldName ) {
			return [sequelize.literal(`
				(SELECT
					COUNT(*)
				FROM
					arguments a
				WHERE
					a.deletedAt IS NULL AND
					a.ideaId = idea.id AND
          a.confirmationRequired IS NULL)
			`), fieldName];
		}

		return {

			// nieuwe scopes voor de api
			// -------------------------

			// defaults
			api: {
			},
			
			mapMarkers: {
				attributes: [
					'id',
					'status',
					'location',
					'position'
				]
				,
				where: {
					$or: [
						{
							status: {$in: ['OPEN', 'ACCEPTED', 'BUSY']}
						}, {
							$and: [
								{status: 'CLOSED'},
								sequelize.literal(`DATEDIFF(NOW(), idea.updatedAt) <= 90`)
							]
						}
					]
				}
			},
			
			// vergelijk getRunning()
			selectRunning: {
				where: {
					$or: [
						{
							status: {$in: ['OPEN', 'CLOSED', 'ACCEPTED', 'BUSY']}
						}, {
							$and: [
								{status: 'DENIED'},
								sequelize.literal(`DATEDIFF(NOW(), idea.updatedAt) <= 7`)
							]
						}
					]
				}
			},
			
			includeArguments: function( userId ) {
				return {
					include: [{
						model    : db.Argument.scope(
							'defaultScope',
							{method: ['withVoteCount', 'argumentsAgainst']},
							{method: ['withUserVote', 'argumentsAgainst', userId]},
							'withReactions'
						),
						as       : 'argumentsAgainst',
						required : false,
						where    : {
							sentiment: 'against',
							parentId : null
						}
					}, {
						model    : db.Argument.scope(
							'defaultScope',
							{method: ['withVoteCount', 'argumentsFor']},
							{method: ['withUserVote', 'argumentsFor', userId]},
							'withReactions'
						),
						as       : 'argumentsFor',
						required : false,
						where    : {
							sentiment: 'for',
							parentId : null
						}
					}],
					// HACK: Inelegant?
					order: [
						sequelize.literal(`GREATEST(0, \`argumentsAgainst.yes\` - ${argVoteThreshold}) DESC`),
						sequelize.literal(`GREATEST(0, \`argumentsFor.yes\` - ${argVoteThreshold}) DESC`),
						'argumentsAgainst.parentId',
						'argumentsFor.parentId',
						'argumentsAgainst.createdAt',
						'argumentsFor.createdAt'
					]
				};
			},

			includeMeeting: {
				include : [{
					model: db.Meeting,
				}]
			},

			includePosterImage: {
				include: [{
					model      : db.Image,
					as         : 'posterImage',
					attributes : ['key'],
					required   : false,
					where      : {},
					order      : 'sort'
				}]
			},

			includeRanking: {
// 				}).then((ideas) => {
// 					// add ranking
// 					let ranked = ideas.slice();
// 					ranked.forEach(idea => {
// 						idea.ranking = idea.status == 'DENIED' ? -10000 : idea.yes - idea.no;
// 					});
// 					ranked.sort( (a, b) => a.ranking < b.ranking );
// 					let rank = 1;
// 					ranked.forEach(idea => {
// 						idea.ranking = rank;
// 						rank++;
// 					});
// 					return sort == 'ranking' ? ranked : ideas;
// 				});
			},
			
			includeVoteCount: {
				attributes: {
					include: [
						voteCount('yes'),
						voteCount('no'),
						argCount('argCount')
					]
				}
			},
			
			includeUser: {
				include: [{
					model      : db.User,
					attributes : ['role', 'nickName', 'firstName', 'lastName', 'email']
				}]
			},
			
			includeUserVote: function(userId) {
				let result = {
					include: [{
						model    : db.Vote,
						as       : 'userVote',
						required : false,
						where    : {
							userId : userId
						}
					}]
				};
				return result;
			},
			
			// vergelijk getRunning()
			sort: function (sort) {

				let result = {};

				var order;
				switch( sort ) {
					case 'votes_desc':
						// TODO: zou dat niet op diff moeten, of eigenlijk configureerbaar
						order = 'yes DESC';
						break;
					case 'votes_asc':
						// TODO: zou dat niet op diff moeten, of eigenlijk configureerbaar
						order = 'yes ASC';
						break;
					case 'date_asc':
						order = 'endDate ASC';
						break;
					case 'date_desc':
					default:
						order = `
							CASE status
								WHEN 'ACCEPTED' THEN 4
								WHEN 'OPEN'     THEN 3
								WHEN 'BUSY'     THEN 2
								WHEN 'DENIED'   THEN 0
								                ELSE 1
							END DESC,
							endDate DESC
						`;
				}

				result.order = order;

				return result;

      },

			// oude scopes
			// -----------
			
			summary: {
				attributes: {
					include: [
						voteCount('yes'),
						voteCount('no'),
						argCount('argCount')
					],
					exclude: ['description', 'modBreak']
				}
			},
			withUser: {
				include: [{
					model      : db.User,
					attributes : ['role', 'nickName', 'firstName', 'lastName', 'email']
				}]
			},
			withVoteCount: {
				attributes: Object.keys(this.attributes).concat([
					voteCount('yes'),
					voteCount('no')
				])
			},
			withVotes: {
				include: [{
					model: db.Vote,
					include: [{
						model      : db.User,
						attributes : ['id', 'zipCode']
					}]
				}],
				order: 'createdAt'
			},
			withPosterImage: {
				include: [{
					model      : db.Image,
					as         : 'posterImage',
					attributes : ['key'],
					required   : false,
					where      : {
						sort: 0
					}
				}]
			},
			withArguments: function( userId ) {
				return {
					include: [{
						model    : db.Argument.scope(
							'defaultScope',
							{method: ['withVoteCount', 'argumentsAgainst']},
							{method: ['withUserVote', 'argumentsAgainst', userId]},
							'withReactions'
						),
						as       : 'argumentsAgainst',
						required : false,
						where    : {
							sentiment: 'against',
							parentId : null,
							confirmationRequired: null
						}
					}, {
						model    : db.Argument.scope(
							'defaultScope',
							{method: ['withVoteCount', 'argumentsFor']},
							{method: ['withUserVote', 'argumentsFor', userId]},
							'withReactions'
						),
						as       : 'argumentsFor',
						required : false,
						where    : {
							sentiment: 'for',
							parentId : null,
							confirmationRequired: null
						}
					}],
					// HACK: Inelegant?
					order: [
						sequelize.literal(`GREATEST(0, \`argumentsAgainst.yes\` - ${argVoteThreshold}) DESC`),
						sequelize.literal(`GREATEST(0, \`argumentsFor.yes\` - ${argVoteThreshold}) DESC`),
						'argumentsAgainst.parentId',
						'argumentsFor.parentId',
						'argumentsAgainst.createdAt',
						'argumentsFor.createdAt'
					]
				};
			},
			withPoll: {
				include: [{
					model      : db.Poll,
					attributes : ['id', 'title', 'description'],
					required   : false
				}]
			},
			withAgenda: {
				include: [{
					model      : db.AgendaItem,
					as         : 'agenda',
					required   : false,
					separate   : true,
					order      : [
            ['startDate', 'ASC']
					]
				}]
			}
		}
	}

	return Idea;
};
