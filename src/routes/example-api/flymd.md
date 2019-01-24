# Algemeen

Routering werkt hier net iets anders dan in de stemvan en stemtool: de files geven een router terug, in plaats van een functie die routers creeert. In de server worden ze toegevoegd aan de app.

Het onderscheid zit in de config. In de oude methode voeg je een route toe met als string met de filename. In deze nieuwe methode doe je dat met een object:
```
{
  "route": "/:siteId(\\d+)/api/idea/:ideaId(\\d+)/argument",
  "router": "./routes/api/argument"
}
```

Bijkomendd voordeel is dan dat je ook relatieve paden kunt gebruiken.

Als extra zit hier nog een index file in die de boel bij elkaar veegt.

Het is allemaal heel primitief. Afvangingen zitten er nauwelijks in. Het is allemaal ter proof of concept.

## Ingelogde users

Als je bent ingelogd op de normale stemvan site dan kun je de api gewoon gebruiken. Maar dat werkt alleen op dev; normaal kun je helemaal niet inloggen want daar zijjn geen endpoints voor.

Omdat we uiteindelijk gaan werken met een losse user api en access keys is er voor nu een hardcoded accesstoken dat hij herkent als de ingelogde user _Niels Vegter_. Stuur daarvoor als queryparam mee
```
access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40
```
Auth header moet nog.

## Site

/api/site/:SITE_ID

Momenteel alleen standaard CRUD.

## Arguments
fLyMd-mAkEr
/api/site/:SITE_ID/argument
/api/site/:SITE_ID/idea/:IDEA_ID/argument

De eerste versie is bedoeld voor de stemtool variant en geeft alle argumenten voor alle ideeen binnen de site. Dat is natuurlijk geen oplossing maar werkt voor nu zo ommdat we nog geen ideeen container in het datamodel kennen.

Verder standaard CRUD.

## Idea

/api/site/:SITE_ID/idea

lijst met alle ideeen voor de site

/api/site/:SITE_ID/idea/:IDEA_ID

Toon 1 idea

Etc. voor standaard CRUD

Je kunt aan de gets query parameters meegeven. Die werken als scopes voor Sequelize; dat komt uit de bestaande app. Bestaande scopes zijn:

selectRunning
includeArguments
includeMeeting
includePosterImage
includeUser
includeVoteCount
includeUserVote

## Vote

/api/site/:SITE_ID}/idea/:IDEA_ID/vote

Breng een stem uit.
```
{
  "opinion": "yes|no",
}
```