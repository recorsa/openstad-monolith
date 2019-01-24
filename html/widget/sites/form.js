class EditSiteWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./form.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {

		let self = this;

		if (parseInt('{{siteId}}')) {
			self.fetch();
		}

		self.shadowRoot.querySelector('input[name="submitButton"]').onclick = self.submit.bind(self);

	}

	fetch() {

		let self = this;

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = '/example-api/site/{{siteId}}'
		url = url + '?access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40';
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

				self.shadowRoot.querySelector('input[name="name"]').value = json.name;
				self.shadowRoot.querySelector('input[name="title"]').value = json.title;

				self.shadowRoot.querySelector('input[name="type"]').value = json.config.type;
				self.shadowRoot.querySelector('input[name="url"]').value = json.config.url;
				self.shadowRoot.querySelector('input[name="hostname"]').value = json.config.hostname;

				self.shadowRoot.querySelector('input[name="noOfColumsInList"]').value = json.config.ideas.noOfColumsInList;

				self.shadowRoot.querySelector('input[name="anonymousAllowed"][value="true"]').checked = json.config.arguments.new.anonymousAllowed;
				self.shadowRoot.querySelector('input[name="anonymousAllowed"][value="false"]').checked = !json.config.arguments.new.anonymousAllowed;
				self.shadowRoot.querySelector('input[name="showFields"]').value = json.config.arguments.new.showFields.join(',');

				self.shadowRoot.querySelector('input[name="maxChoices"]').value = json.config.votes.maxChoices;
				self.shadowRoot.querySelector('input[name="replaceOrError"]').value = json.config.votes.replaceOrError;
				self.shadowRoot.querySelector('input[name="userRole"]').value = json.config.votes.userRole;

				self.shadowRoot.querySelector('input[name="submitButton"]').disabled = false;


			})
			.catch(function (error) {
				console.log('Request failed', error);
			});
	}

	submit() {

		// todo: hij is nu alleen edit maar zzou ook new moeten kunnen

		console.log('xxx')
		console.log(this)

		let self = this;
		self.shadowRoot.querySelector('input[name="submitButton"]').disabled = true;

		
		let data = {
			name: self.shadowRoot.querySelector('input[name="name"]').value,
			title: self.shadowRoot.querySelector('input[name="title"]').value,
			config: {
				type: self.shadowRoot.querySelector('input[name="type"]').value,
				url: self.shadowRoot.querySelector('input[name="url"]').value,
				hostname: self.shadowRoot.querySelector('input[name="hostname"]').value,
				ideas: {
					noOfColumsInList: parseInt( self.shadowRoot.querySelector('input[name="noOfColumsInList"]').value ),
				},
				arguments: {
					new: {
						anonymousAllowed: self.shadowRoot.querySelector('input[name="anonymousAllowed"][value="true"]').checked,
						showFields: self.shadowRoot.querySelector('input[name="showFields"]').value.split(/\s*,\s*/),
					}
				},
				votes: {
					maxChoices: parseInt( self.shadowRoot.querySelector('input[name="maxChoices"]').value ),
					replaceOrError: self.shadowRoot.querySelector('input[name="replaceOrError"]').value,
					userRole: self.shadowRoot.querySelector('input[name="userRole"]').value,
				}
			},
		}

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = '{{apiUrl}}/example-api/site/{{siteId}}'
		url = url + '?access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40';
		fetch(url, {
			method: 'put',
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify(data),
		})
	 		.then(function (response) {
				console.log(response)
				return response.json();
			})
			.then(function (json) {
				console.log('Request succeeded with JSON response', json);
				self.fetch();
			})
			.catch(function (error) {
				alert('ERROR')
				self.fetch();
				console.log('Request failed', error);
			});
		
	}

}

customElements.define('edit-site-widget', EditSiteWidget);
