# Widgets

De widgets werken als vanilla web components. Die kun je polyfillen met een js van de webcomponents organisatie; dat gebeurt in de /examples dir:
```
<script src="/examples/js/webcomponents-hi-sd-ce.js"></script>
```

Je gebruikt ze dan zo:
```
<script src="/widget/site/2/ideas?access_token=:ACCESS_TOKEN"></script>
<ideas-widget>loading ideas...</ideas-widget>
```

De eerste regel haalt de widget op. Dat definieert een custom element, en die wordt in de tweede regel gebruikt.

In de /examples dir zie je dat gebruikt worden.

Ik heb er wat simpele voorbeelden ingestopt. Daarbij vooral ook een poging om te laten zien hoe dat zou kunnen werken met simpele widgets die dan binnen een cms overruled worden. Natuurlijk qua css, maar ook een iets complexer voorbeeld met de genummerde knoppen die we gebruiken.

De widgets worden door de server aangemaakt op basis van de site configuratie. Daardoor werkt een argumenten formuier op site1 anders dan op site2.

Daarnaast kun je attributes meegeven aan een custom tag. De bovenstaande ideas-widget bijvoorbeeld herkent een href attribute:
```
<ideas-widget href="/examples/site-2-idea.html?id=[[id]]">loading ideas...</ideas-widget>
```
Dat maakt de ideeen in de lijst aanklikbaar.

Zo ook de 'toon 1 idee' widget: die verwacht een id van het te tonen idee:
```
<idea-widget data-id="10">loading idea...</idea-widget>
```

Ik heb zelf de attribs 'afterRenderCallback' en 'afterAttributeChangedCallback' bedacht; wellicht bestaan daar al generiekere oplossingen voor.