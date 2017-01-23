var co = require('co');
var db = require('../db');

module.exports = function( app ) {
	app.get('/', co.wrap(function*( req, res ) {
		var data = yield {
			articles         : getArticles(),
			highlightedIdeas : db.Idea.getHighlighted(),
			upcomingMeetings : db.Meeting.getUpcoming(3)
		};
		
		res.out('index', true, data);
	}));
};

function getArticles() {
	return Promise.resolve([{
		title   : 'Jeroen wil dynamiek!',
		summary : `Jeroen wil meer dynamiek in West! Hij wil bewoners enthousiasmeren
		           mee te denken over de kansen die er liggen om hun buurt nóg beter
		           en leuker te maken.`
	}, {
		title   : 'Hugo de Grootkade autovrij',
		summary : `Bewoner Mischa Woutersen had een bijzonder voorstel: straten in
		           West een maand lang autovrij maken. Zijn plan werd werkelijkheid!
		           In de zomer werd de eerste autovrije straat gerealiseerd: de Hugo
		           de Grootkade! `
	}, {
		title   : 'Bernadette wil meer doen met ideeën uit de buurt',
		summary : `Huiswerklessen geven, koken voor anderen of op elkaars kinderen
		           passen: in haar wijk gebeurt het allemaal. Ontmoet Bernadette
		           Vieverich.`
	}, {
		title   : 'Samen voor je buurt zorgen!',
		summary : `Jelle vindt dat burgers zelf verantwoordelijkheid moeten krijgen.
		           Hij leerde dit bij het jongerencentrum waar hij actief is. Iedereen
		           heeft de sleutel van het gebouw, waardoor bewoners zich samen
		           verantwoordelijk voelen.`
	}, {
		title   : '\‘West heeft een ruig randje en is lekker mixed.\’',
		summary : `Alexander IJkelenstam leeft in een buurt die bij hem past.`
	}, {
		title   : '\‘Samenwerken is belangrijk\’',
		summary : `De Stem van West is een mooi voorbeeld van co-creatie en samenwerking
		           tussen inwoners en het Algemeen Bestuur, vindt Bjørn Lanser.`
	}, {
		title   : 'Buurtbewoners kiezen eigen architect',
		summary : `Bij de herinrichting van het Karel Doormanplein koos een groep actieve
		           bewoners zelf voor een architect. Maar dat was niet alles. Ze zorgden
		           ook voor de renovatie van het jongerencentrum!`
	}, {
		title   : 'Klagen of afspraken maken?',
		summary : `Je kunt klagen over afval, maar je kunt ook samen afspraken maken.
		           Dat is een veel prettigere manier om met elkaar om te gaan in de wijk,
		           vindt Onika.`
	}, {
		title   : 'Met kleine stapjes tot grote veranderingen komen',
		summary : `Een veranderproces is zwaar, maar met kleine stapjes kun je steeds
		           verder komen. Ralph Stuyver weet inmiddels hoe hij zijn buurt stapje
		           voor stapje mooier kan maken.`
	}]);
}