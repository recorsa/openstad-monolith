var co      = require('co');
var moment  = require('moment-timezone');
var db      = require('../db');
var noCache = require('../middleware/nocache');

module.exports = function( app ) {
	app.get('/', noCache, co.wrap(function*( req, res ) {
		var data = yield {
			articles         : getArticles(),
			highlightedIdeas : db.Idea.getHighlighted(),
			upcomingMeetings : db.Meeting.getUpcoming(3)
		};
		
		res.out('index', true, data);
	}));
}

function getArticles() {
	return Promise.resolve([{
		title   : 'Hugo de Grootkade omgetoverd tot leefstraat door idee Mischa',
		summary : `Bewoner Mischa pitchte zijn idee voor leefstraten
		           bij het Algemeen Bestuur. Zij waren zo enthousiast
		           dat de eerste 'leefkade' deze zomer al een feit was!`
	}, {
		title   : 'Bewoners kiezen zelf architect',
		summary : `Bij de herinrichting van het Karel Doormanplein besloot
		           een groep actieve bewoners om ook het jongerencentrum
		          'New Society' op te knappen.`
	}, {
		title   : 'Jouw buurt heeft een ambassadeur!',
		summary : `De buurtadoptant, zoals die genoemd wordt, is er om
		           samen met jou de buurt nog beter te maken. Lees hier
		           hoe.`
	}, {
		title   : 'Bernadette wil meer doen met ideeën uit de buurt',
		summary : `Huiswerklessen geven, koken voor anderen of op elkaars
		           kinderen passen: in de wijk van Bernadette Vieverich
		          gebeurt het allemaal.`
	}, {
		title   : 'Nog meer leefstraten!',
		summary : `Na het succes van de eerste leefkade hebben bewoners
		           van de Filips van Almondestraat zich aangemeld om gebruik
		           te maken van het initiatiefvoorstel 'Flexstraten'.`
	}, {
		title   : 'Je buurt nog leuker maken!',
		summary : `Jelle vind dat de burgers zelf verantwoordelijkheid
		           moeten krijgen. Net zoals hij dat geleerd heeft bij
		           het vrijzinnige jongerencentrum waar hij terecht kwam
		           na zijn studie filosofie.`
	}, {
		title   : 'Schoolklas wil oversteekplaats',
		summary : `Kinderen spreken in op de vergadering van het Algemeen
		           Bestuur om een oversteekplaats bij hun school te krijgen.`
	}, {
		title   : 'Algemeen Bestuur komt naar u toe',
		summary : `Bewoners kunnen het AB vragen om in hun buurt op locatie
		           te komen om een dringende vraag of probleem te bespreken.`
	}]);
}