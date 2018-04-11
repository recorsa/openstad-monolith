var _      = require('lodash')
	, co     = require('co')
	, moment = require('moment-timezone')
var log    = require('debug')('app:db');


module.exports = co.wrap(function*( db ) {
	log('generating user, idea, poll, votes, arguments...');
	yield users.map(function( userData ) {
		return db.User.create(userData, {
			include  : [{
				model: db.Idea,
				include: [{
					model : db.AgendaItem,
					as    : 'agenda'
				}, {
					model : db.Poll,
					include: [{
						model   : db.PollOption,
						as      : 'options',
						include : [{
							model : db.PollVote,
							as    : 'votes'
						}]
					}]
				}, {
					model : db.Argument,
					as    : 'argumentsAgainst'
				}, {
					model : db.Argument,
					as    : 'argumentsFor'
				}]
			}]
		});
	});
	
	log('test database complete');
});

// Users including their ideas
// ---------------------------
// This data is only used for the dev fixtures, so no shared file in
// `data` folder required.
var today = moment().endOf('day');
var users = [
	{id : 1 , complete : 0 , role : 'unknown'},
	{
		id        : 2,
		complete  : 1 ,
		role      : 'admin',
		email     : 'info@openstadsdeel.nl',
		password  : 'password',
		firstName : 'Systeem',
		lastName  : 'Beheerder',
		gender    : 'male',
		ideas     : [{
			id               : 1,
			startDate        : moment(today),
			title            : 'Boomloze wijk',
			summary          : 'Bomen geven troep en nemen licht weg. Uit de grond ermee!',
			description      : 'Al die boomknuffelaars die vast willen houden aan het verleden. Tijd voor een frisse wind! Alle bomen de grond uit, en een hoge muur om alle parken heen, zodat vallende bladeren geen probleem meer zijn!',
			agenda           : [{
				startDate: '2017-02-14',
				endDate: null,
				description: 'Deadline aanmelden werkgroep',
				actionText: 'Meld je aan',
				actionURL: '/signup'
			}, {
				startDate: '2017-03-07',
				endDate: '2017-03-28',
				description: 'Stemmen op je favoriete ontwerp via deze site',
				actionText: null,
				actionURL: null
			}, {
				startDate: '2017-03-28',
				endDate: null,
				description: 'Laatste dag om stem uit te brengen op ontwerp van jouw keuze',
				actionText: null,
				actionURL: null
			}, {
				startDate: '2018-04-01',
				endDate: '2017-04-14',
				description: 'Stemmen tellen en reacties verwerken',
				actionText: null,
				actionURL: null
			}, {
				startDate: '2018-04-21',
				endDate: null,
				description: 'Presentatie van winnend ontwerp',
				actionText: null,
				actionURL: null
			}],
			poll             : {
				id          : 1,
				title       : 'De ontwerpen',
				description : null,
				options: [{
					order       : 'A',
					title       : 'Aansluiten op veilig fietspadennetwerk',
					intro       : null,
					description : '',
					votes       : [{
						pollId : 1,
						userId : 5,
						ip     : '127.0.0.1'
					}, {
						pollId : 1,
						userId : 6,
						ip     : '127.0.0.1'
					}, {
						pollId : 1,
						userId : 7,
						ip     : '127.0.0.1'
					}, {
						pollId : 1,
						userId : 8,
						ip     : '127.0.0.1'
					}]
				}, {
					order       : 'B',
					title       : 'Openbaar vervoer bereikbaar voor iedereen',
					intro       : null,
					description : '',
					votes       : [{
						pollId : 1,
						userId : 5,
						ip     : '127.0.0.1'
					}, {
						pollId : 1,
						userId : 6,
						ip     : '127.0.0.1'
					}]
				}, {
					order       : 'C',
					title       : 'Aandacht voor de automobilist',
					intro       : null,
					description : '',
					votes       : [{
						pollId : 1,
						userId : 8,
						ip     : '127.0.0.1'
					}, {
						pollId : 1,
						userId : 9,
						ip     : '127.0.0.1'
					}, {
						pollId : 1,
						userId : 10,
						ip     : '127.0.0.1'
					}]
				}, {
					order       : 'D',
					title       : 'Autoluw en ruimte voor recreatie',
					intro       : null,
					description : '',
					votes       : [{
						pollId : 1,
						userId : 10,
						ip     : '127.0.0.1'
					}]
				}]
			},
			argumentsAgainst : [
				{userId: 3, sentiment: 'against' , description: 'Bomen zijn goed voor mensen, en zuiveren de lucht. Ik wil niet weten wat er gaat gebeuren met de omgeving als we alle bomen weghalen?! Gekkigheid...'},
				{userId: 4, sentiment: 'against' , description: 'Dit is een hellend vlak. Wat gaat dit betekenen voor de struiken? De struiken, de struiken, de struiken, de struiken, de struiken, de struiken, de struiken...'}
			]
		}]
	},
	
	{id : 3  , complete : 1 , role : 'member'       , email : 'test@test.com'  , password : null, firstName : 'Maria'     , lastName : 'Parker'    , gender : 'female' , zipCode : null}      ,
	{id : 4  , complete : 1 , role : 'member'       , email : 'test2@test.com' , password : null, firstName : 'Judy'      , lastName : 'Hill'      , gender : 'female' , zipCode : null}      ,
	{id : 5  , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Edwards'   , gender : 'female' , zipCode : null}      ,
	{id : 6  , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Cole'      , gender : 'male'   , zipCode : null}      ,
	{id : 7  , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Scott'     , gender : 'male'   , zipCode : null}      ,
	{id : 8  , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Kim'       , gender : 'female' , zipCode : null}      ,
	{id : 9  , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Rose'      , gender : 'male'   , zipCode : '1050 GH'} ,
	{id : 10 , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Greene'    , gender : 'male'   , zipCode : null}      ,
	{id : 11 , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : null        , gender : 'female' , zipCode : '1053 BM'} ,
	{id : 12 , complete : 0 , role : 'anonymous'    , email : null             , password : null, firstName : null        , lastName : 'Miller'    , gender : 'male'   , zipCode : null}
];