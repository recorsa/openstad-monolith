class IdeasWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./ideas.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {
		let self = this;

		if (self.getAttribute('data-css')) {
			console.log('extra CSS')
			let link = document.createElement('link');
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = self.getAttribute('data-css');
			self.shadowRoot.appendChild(link)
		}

		self.fetch();
	}

	fetch() {
		let self = this;

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = `{{apiUrl}}/api/site/{{siteId}}/idea/?running=true&includePosterImage=true&includeVoteCount=true`
		url = url + '&access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40';
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

				self.data = json;
				self.render(json)

			})
			.catch(function (error) {
				console.log('Request failed', error);
			});
	}

	render(data) {

		let self = this;
		let href = this.getAttribute('href') || '';

		data.forEach(idea => {

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
			

			self.shadowRoot.querySelector('ideas-list').appendChild(template)

		})

		if (self.getAttribute('afterRenderCallback')) {
			eval(`${self.getAttribute('afterRenderCallback')}(self)`);
		}

	}
	
}

customElements.define('ideas-widget', IdeasWidget);
