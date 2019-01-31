# Algemeen

Dit is een JSON API server

##Login:

```GET /oauth/login```

Hij logt de gebruiker in als gewone, lokale, monolith user, en vanaf daar werkt dat als verwacht. Die user wordt zonodig aangemaakt.
Voor nu ga ik er vanuit dat de required fields email, firstName, lastName en postcode beschikbaar zijn in mijnopenstad. Een nieuwe user heeft de role 'member'

Hij redirect naar `xxx/?jwt=JWT`

xxx staat in local.json en is nu 

Met die JWT kun je ook API calls doen. Die moet je meesturen als header:
```X-Authorization: Bearer JWT```

Dat heet `X-Authorization` omdat hij anders botst met de basic authentication

Dat is denk ik hoe buurtbudget het doet? Over een oplossing voor de GET met JWT heb ik wel ideeen, maar moeten we denk ik even bespreken.

#### TODO
- rollen moeten denk ik naar mijnoopenstad
- flexibiliteit mbt. tot velden in mijnopenstad versus lokaal
- per site inloggen; je logt nu in op alles
- verzin iets beters dan X-Authorization


##Site

`GET /api/site/`
list all sites

`POST /api/site/`
create a site

`GET /api/site/:SITE_ID`
view one site

`PUT /api/site/:SITE_ID`
update one site

`DELETE /api/site/:SITE_ID`
delete one site

GET request zijn public, de anderen alleen toegankelijk voor admin

##Idea

`GET /api/site/:SITE_ID/idea/`
list all ideas

`POST /api/site/:SITE_ID/idea/`
create an idea

`GET /api/site/:SITE_ID/idea/:IDEA_ID`
view one idea

`PUT /api/site/:SITE_ID/idea/:IDEA_ID`
update one idea

`DELETE /api/site/:SITE_ID/idea/:IDEA_ID`
delete one idea

GET request zijn public, POST is alleen toegankelijk voor admin, de anderen alleen voor admin en de eigenaar

Je kunt aan de GETs query parameters meegeven. Die werken als scopes voor Sequelize; dat komt uit de bestaande app. Bestaande scopes zijn:

`selectRunning`
`includeArguments`
`includeMeeting`
`includePosterImage`
`includeUser`
`includeVoteCount`
`includeUserVote`

#### TODO
- Wat hier nog niet is geimplementeerd is een oplossing voor images; je krijgt nu terug wat er in de DB zit.
- Ik denk dat er een overkoepelend idea zou moeten zijn, maar even overleggen


##Vote

In ontwikkeling

##Argument

In ontwikkeling

## Algemeen TODO
- Error handling loopt nog via de standaards van de monolith. Dat moet anders want ze zijn nu niet in JSON.
- De mijnopenstad config verondersteld een paar urls die nog niet zijn ingericht
- Ik zou graag ASAP de images naar de image server overbrengen
- PUT requests werken nu als PATCH reuqests; dat zou je voor heel netjes een keer uit elkaar moeten trekken




