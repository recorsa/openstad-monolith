# Algemeen


Routering werkt hier net iets anders dan in de stemvan en stemtool: de files geven een router terug, in plaats van een functie die routers creeert. In de server worden ze toegevoegd aan de app.

Het onderscheid zit in de config. In de oude methode voeg je een route toe met als string met de filename. In deze nieuwe methode doe je dat met een object:
```
{
  "route": "/:siteId(\\d+)/api/idea/:ideaId(\\d+)/argument",
  "router": "./routes/api/argument"
}
```

Bijkomd voordeel is dan dat je ook relatieve paden kunt gebruiken.

Als extra zit hier nog een index file in die de boel bij elkaar veegt.


## Site
/site/:ID

Momenteel alleen standaard CRUD.

## Idea

## Vote



