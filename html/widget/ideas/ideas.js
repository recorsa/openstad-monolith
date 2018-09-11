class IdeasWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./ideas.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {
		// this.shadowRoot.querySelector('idea-controls').innerHTML = 'Knoppen'
		let href = this.getAttribute('href') || '';
		this.fetch();
	}

	fetch() {
		let self = this;
		let href = this.getAttribute('href') || '';

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = `{{apiUrl}}/api/site/{{siteId}}/idea/?running=true&includePosterImage=true&includeVoteCount=true`
		fetch(url, {
			method: 'get',
			headers: {
				"Accept": "application/json"
			},
		})
			.then(function (response) {
				return response.json();
			})
			.then(function (json) {

				console.log('Request succeeded with JSON response', json);

				json.forEach(idea => {

					var template = self.shadowRoot.querySelector('#idea-template').content.cloneNode(true);
					
					template.querySelector('idea').id = idea.id;
					template.querySelector('a').href = href.replace(/\[\[id\]\]/g, idea.id);
					
					template.querySelector('idea-title').innerHTML = idea.title;
					template.querySelector('idea-summary').innerHTML = idea.summary;
					template.querySelector('idea-counters').innerHTML = `${idea.yes}, ${idea.no}, ${idea.argCount}`;

					// temp, want moet beter
					let imagesElement = document.createElement('idea-images');
					idea.posterImage && idea.posterImage.forEach( image => {
						let imageElement = document.createElement('idea-image');
						let imageDiv = document.createElement('div');
						imageDiv.style.backgroundImage  = `url({{imageUrl}}/image/${image.key})`
						imageElement.appendChild(imageDiv);
						imagesElement.appendChild(imageElement)
					});
					template.querySelector('idea-images').innerHTML = imagesElement.innerHTML;
					

					self.shadowRoot.querySelector('ideas').appendChild(template)

				})

			})
			.catch(function (error) {
				console.log('Request failed', error);
			});
	}

}

customElements.define('ideas-widget', IdeasWidget);
