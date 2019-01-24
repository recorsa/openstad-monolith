class imageContainerWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./image-container.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {
		let description = this.getAttribute('description');
		if (description) {
			this.shadowRoot.querySelector('image-container').innerHTML = description;
		}
	}

}

customElements.define('image-container-widget', imageContainerWidget);
