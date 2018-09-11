 class OpenStadMapWidget extends HTMLElement {

	 constructor() {
		 super();
		 var template = document.createElement('template');
		 template.innerHTML = `{% include "./openstad-map.html" %}`;
		 var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	 }

	 connectedCallback () {
		 // this.shadowRoot.querySelector('idea-controls').innerHTML = 'Knoppen'
		 // let href = this.getAttribute('href') || '';
		 // this.fetch();
	 }

 }

 customElements.define('openstad-map-widget', OpenStadMapWidget);
