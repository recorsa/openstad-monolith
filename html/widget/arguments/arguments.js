class ArgumentsWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./arguments.html" %}`;
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

		this.fetch();

	}

	fetch() {
		let self = this;
		let href = this.getAttribute('href') || '';

		// TODO: cleanup
		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = `{{apiUrl}}?`;
		url = url.replace('[[id]]', self.getAttribute('data-idea-id'));
		if (this.getAttribute('sentiment')) {
			url = url + 'sentiment=' + this.getAttribute('sentiment')
		}
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

				// console.log('Request succeeded with JSON response', json);

				self.shadowRoot.querySelector('arguments').innerHTML = '';

				json.forEach(argument => {

					var template = self.shadowRoot.querySelector('#argument-template').content.cloneNode(true);
					
					template.querySelector('argument').id = 'argument-' + argument.id;

					template.querySelector('argument-username').innerHTML = argument.user.nickName || argument.user.fullName;
					template.querySelector('argument-description').innerHTML = argument.description;

					self.shadowRoot.querySelector('arguments').appendChild(template)

				})
			})
			.catch(function (error) {
				// console.log('Request failed', error);
			});

	}

	static get observedAttributes() {return ['data-idea-id']; }

	attributeChangedCallback(name, oldValue, newValue) {

		let self = this;

		// console.log(name, oldValue, newValue)

		if (name == 'data-idea-id') {
			self.fetch();
		}

	}

}

customElements.define('arguments-widget', ArgumentsWidget);
