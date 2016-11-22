var _      = require('lodash')
  , co     = require('co')
  , moment = require('moment')
var log    = require('debug')('app:db');

module.exports = co.wrap(function*( db ) {
	log('generating meetings...');
	yield meetings.map(function( meetingData ) {
		return db.Meeting.create(meetingData);
	});
	log('generating users and ideas...');
	yield users.map(function( userData ) {
		return db.User.create(userData, {
			include: [db.Idea]
		});
	});
	log('generating votes...');
	yield _.flatten(_.map(votes, function( votesForIdea, ideaId ) {
		return db.Idea.findById(ideaId).then(function( idea ) {
			return Promise.all(votesForIdea.map(function( vote ) {
				// console.log(idea.constructor.prototype);
				return idea.createVote(vote);
			}));
		});
	}));
	log('test database complete');
});

var today = moment().startOf('day');

// Meetings
// --------
var meetings = [
	{id: 1, date: moment(today).day(5).toDate()},
	{id: 2, date: moment(today).day(5).add(2, 'weeks').toDate()},
	{id: 3, date: moment(today).day(5).add(4, 'weeks').toDate()}
];
// Users including their ideas
// ---------------------------
var users = [
	{id : 1 , role : 'unknown'},
	{id : 2 , role : 'admin'     , userName : 'admin'  , password : 'password'        , firstName : 'Bastard-Operator' , lastName : 'from Hell' , gender : 'male' , ideas : [
		{
			id          : 1,
			startDate   : moment(today).add(1, 'days'),
			title       : 'Een idee',
			summary     : 'Ik heb een idee',
			description : 'Dit is het hele verhaal achter het test idee.'
		}, {
			id          : 2,
			startDate   : moment(today).add(10, 'days'),
			title       : 'Nog een idee',
			summary     : 'Het houdt niet op',
			description : 'Deze heb ik ook helemaal zelf bedacht.'
		}
	]},
	{id : 3  , role : 'member'   , userName : 'margaret' , password : 'FPGkM9s'      , firstName : 'Jennifer'  , lastname : 'Alexander' , gender : 'female' , email : 'jalexander0@va.gov'         , zipCode : null, ideas :[
		{
			id          : 3,
			startDate   : moment(today).add(6, 'days'),
			title       : 'Markt uitbreiden',
			summary     : 'Er moet plek zijn voor twee groentemannen!',
			description : 'De groenteman die er nu staat is veel te duur. Ik wil goedkopere appels, dus er moet concurrentie komen.'
		}
	]},
	{id : 4  , role: 'anonymous' , userName : null       , password : null           , firstName : null        , lastName : null        , gender : 'male'   , email : 'crice1@nsw.gov.au'          , zipCode : '1051 RL'} ,
	{id : 5  , role: 'member'    , userName : 'andrea'   , password : 'fuxQRmDzGC'   , firstName : 'Jane'      , lastName : 'Edwards'   , gender : 'female' , email : 'jedwards2@statcounter.com'  , zipCode : null}      ,
	{id : 6  , role: 'member'    , userName : 'david'    , password : 'vPb2ycQFKt8'  , firstName : 'Justin'    , lastName : 'Cole'      , gender : 'male'   , email : 'jcole3@skype.com'           , zipCode : null}      ,
	{id : 7  , role: 'member'    , userName : 'thomas'   , password : 'ZrY7tsEhlv'   , firstName : 'Sean'      , lastName : 'Scott'     , gender : 'male'   , email : null                         , zipCode : null}      ,
	{id : 8  , role: 'member'    , userName : 'beverly'  , password : 'ra4UILqrctwq' , firstName : 'Laura'     , lastName : 'Kim'       , gender : 'female' , email : null                         , zipCode : null}      ,
	{id : 9  , role: 'member'    , userName : 'brandon'  , password : 'fJvrKcEKn'    , firstName : 'Donald'    , lastName : 'Rose'      , gender : 'male'   , email : 'drose6@netscape.com'        , zipCode : '1050 GH'} ,
	{id : 10 , role: 'member'    , userName : 'gregory'  , password : 'ItNPABxwyj6'  , firstName : 'Joe'       , lastName : 'Greene'    , gender : 'male'   , email : 'jgreene7@uol.com.br'        , zipCode : null}      ,
	{id : 11 , role: 'anonymous' , userName : null       , password : null           , firstName : null        , lastName : null        , gender : 'female' , email : 'pperkins8@springer.com'     , zipCode : '1053 BM'} ,
	{id : 12 , role: 'member'    , userName : 'william'  , password : 'tHZn7Q'       , firstName : 'Albert'    , lastName : 'Miller'    , gender : 'Male'   , email : 'amilleru@jugem.jp'          , zipCode : null}      ,
	{id : 13 , role: 'member'    , userName : 'michelle' , password : '7HMeZ7DGGksV' , firstName : 'Christine' , lastName : 'Fowler'    , gender : 'Female' , email : 'cfowlerv@deliciousdays.com' , zipCode : null}      ,
	{id : 14 , role: 'member'    , userName : 'fitz'     , password : 'a69GBf7GsE4'  , firstName : 'Jimmy'     , lastName : 'Hughes'    , gender : 'Male'   , email : 'jhughesw@netlog.com'        , zipCode : '1050 JK'} ,
	{id : 15 , role: 'member'    , userName : 'albert'   , password : 'I8ireC3iOP'   , firstName : 'Carlos'    , lastName : 'Carr'      , gender : 'Male'   , email : 'ccarrx@moonfruit.com'       , zipCode : '1054 WK'} ,
	{id : 16 , role: 'member'    , userName : 'maria'    , password : 'kb1KeoZc8'    , firstName : 'Jessica'   , lastName : 'Foster'    , gender : 'Female' , email : 'jfostery@harvard.edu'       , zipCode : '1050 ER'} ,
	{id : 17 , role: 'member'    , userName : 'eric'     , password : 'vWSqV8nB'     , firstName : 'Steven'    , lastName : 'Hawkins'   , gender : 'Male'   , email : 'shawkinsz@google.com.au'    , zipCode : '1051 AB'} ,
	{id : 18 , role: 'member'    , userName : 'bonzi'    , password : '63uCZrurs'    , firstName : 'Michelle'  , lastName : 'Jacobs'    , gender : 'Female' , email : 'mjacobs10@chronoengine.com' , zipCode : null}      ,
	{id : 19 , role: 'member'    , userName : 'brenda'   , password : 'rEY06Uly4X'   , firstName : 'Maria'     , lastName : 'Parker'    , gender : 'Female' , email : null                         , zipCode : null}      ,
	{id : 20 , role: 'member'    , userName : 'susan'    , password : 'ybfDLt36NMM'  , firstName : 'Beverly'   , lastName : 'Black'     , gender : 'Female' , email : null                         , zipCode : null}      ,
	{id : 21 , role: 'anonymous' , userName : null       , password : null           , firstName : null        , lastName : null        , gender : 'Female' , email : null                         , zipCode : '1050 FG'} ,
	{id : 22 , role: 'member'    , userName : 'kathy'    , password : 'PJxXmeA5XAd'  , firstName : 'Janet'     , lastName : 'Jones'     , gender : 'Female' , email : 'jjones14@hp.com'            , zipCode : null}      ,
	{id : 23 , role: 'anonymous' , userName : null       , password : null           , firstName : null        , lastName : null        , gender : 'Female' , email : null                         , zipCode : '1051 TH'} ,
	{id : 24 , role: 'member'    , userName : 'tina'     , password : 'X6aD06u'      , firstName : 'Janet'     , lastName : 'Smith'     , gender : 'Female' , email : 'jsmith16@cnbc.com'          , zipCode : null}      ,
	{id : 25 , role: 'member'    , userName : 'jessica'  , password : 'WSeqnH'       , firstName : 'Frances'   , lastName : 'Watson'    , gender : 'Female' , email : 'fwatson17@alibaba.com'      , zipCode : null}      ,
	{id : 26 , role: 'member'    , userName : 'jimmy'    , password : 'mRHoBGu1yrKm' , firstName : 'Clarence'  , lastName : 'Jordan'    , gender : 'Male'   , email : 'cjordan18@lulu.com'         , zipCode : null}      ,
	{id : 27 , role: 'member'    , userName : 'anna'     , password : 'E1amNfG'      , firstName : 'Debra'     , lastName : 'Ferguson'  , gender : 'Female' , email : null                         , zipCode : null}      ,
	{id : 28 , role: 'member'    , userName : 'jennifer' , password : 'ruj44zW9Hgn'  , firstName : 'Lois'      , lastName : 'Hughes'    , gender : 'Female' , email : 'lhughes1a@marriott.com'     , zipCode : null}      ,
	{id : 29 , role: 'member'    , userName : 'lola'     , password : '3esoK36QCnf8' , firstName : 'Jennifer'  , lastName : 'West'      , gender : 'Female' , email : 'jwest1b@hugedomains.com'    , zipCode : null}      ,
	{id : 30 , role: 'member'    , userName : 'theresa'  , password : '9erzgsH'      , firstName : 'Judy'      , lastName : 'Hill'      , gender : 'Female' , email : 'jhill1c@4shared.com'        , zipCode : null}      ,
	{id : 31 , role: 'member'    , userName : 'ryan'     , password : '8Vh1vixS'     , firstName : 'Earl'      , lastName : 'Stone'     , gender : 'Male'   , email : 'estone1d@baidu.com'         , zipCode : null}
];
// Votes per idea
// --------------
var votes = {
	1: [
		{userId: 3  , opinion: 'yes'},
		{userId: 2  , opinion: 'no'},
		{userId: 4  , opinion: 'yes'},
		{userId: 10 , opinion: 'yes'},
		{userId: 12 , opinion: 'no'},
		{userId: 21 , opinion: 'yes'},
		{userId: 6  , opinion: 'yes'},
		{userId: 8  , opinion: 'no'}
	],
	2: [
		{userId: 2  , opinion: 'yes'},
		{userId: 4  , opinion: 'no'},
		{userId: 5  , opinion: 'no'},
		{userId: 7  , opinion: 'no'},
		{userId: 9  , opinion: 'yes'},
		{userId: 11 , opinion: 'yes'},
		{userId: 13 , opinion: 'no'},
		{userId: 18 , opinion: 'no'},
		{userId: 25 , opinion: 'yes'},
		{userId: 28 , opinion: 'no'},
		{userId: 29 , opinion: 'yes'},
		{userId: 30 , opinion: 'no'}
	],
	3: [
		{userId: 15 , opinion: 'no'},
		{userId: 7  , opinion: 'no'},
		{userId: 19 , opinion: 'yes'},
		{userId: 21 , opinion: 'yes'},
		{userId: 2  , opinion: 'no'}
	]
}