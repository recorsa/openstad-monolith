 class OpenStadMapWidget extends HTMLElement {

	 constructor() {
		 super();
		 var template = document.createElement('template');
		 template.innerHTML = `{% include "./openstad-map.html" %}`;
		 var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	 }

	 connectedCallback () {
		 let description = this.getAttribute('description');
		 if (description) {
			 this.shadowRoot.querySelector('openstad-map').innerHTML = description;
		 }
	 }

 }

 customElements.define('openstad-map-widget', OpenStadMapWidget);
