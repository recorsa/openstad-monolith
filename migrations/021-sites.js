var db = require('../src/db').sequelize;
var config = require('config');

var sites = {
	'11': {name: 'image-server', title: 'Image server' },
	'51': {name: 'stemvanwest', title: 'Stem van West' },
	'52': {name: 'stemvancentrum', title: 'Stem van Centrum' },
	'53': {name: 'stemvanoost', title: 'Stem van Oost' },
	'54': {name: 'stemvannieuwwest', title: 'Stem van Nieuw-West' },
	'55': {name: 'stemvanzuidoost', title: 'Stem van Zuidoost' },
	'56': {name: 'stemvannoord', title: 'Stem van Noord' },
	'57': {name: 'stemvanzuid', title: 'Stem van Zuid' },
	'61': {name: 'javabrug', title: 'Javabrug' },
	'62': {name: 'kareldoorman', title: 'Kunst op het Karel Doormanplein' },
	'63': {name: 'kademuren', title: 'Herengracht 1 - 103: nieuwe inrichting straat' },
	'70': {name: 'zorggoedvooronzestad', title: 'Zorg goed voor onze stad' },
	'76': {name: 'westbegroot-phase-3', title: 'Westbegroot' },
	'110': {name: 'buurtbudget', title: 'Buurtbudget' },
	'111': {name: 'buurtbudget-api', title: 'Buurtbudget API' },
	'120': {name: 'westbegroot-original-ideas', title: 'Westbegroot originele ideeën' },
}

var siteId = config.siteId;
if ( typeof siteId != 'number' ) {
	siteId = Object.keys(sites).find( id => sites[id].name == siteId );
}

module.exports = {
	up: function() {
		if (!siteId) { console.log('Site not found'); return; }
		return db.query(`
      INSERT INTO sites VALUES (${siteId}, '${sites[siteId].name}', '${sites[siteId].title}', '{}', NOW(), NOW(), NULL);
      UPDATE ideas SET siteId = ${siteId};
      UPDATE meetings SET siteId = ${siteId};
      UPDATE articles SET siteId = ${siteId};
		`);
	},
	down: function() {
		return;
	}
}
