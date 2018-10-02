class EditIdeaWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./form.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {

		let self = this;

		// load css
		if (self.getAttribute('data-css')) {
			let link = document.createElement('link');
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = self.getAttribute('data-css');
			self.shadowRoot.appendChild(link)
		}

		// load textarea-with-counter
		let element = document.createElement('script');
		element.src = "{{widgetUrl}}/widget/textarea-with-counter?access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40";
		element.onload = self.initSummary.bind(self);
		self.shadowRoot.appendChild(element);

		// load textarea-with-counter
		let element2 = document.createElement('script');
		element2.src = "{{widgetUrl}}/widget/openstad-map?access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40";
		element2.onload = self.initOpenStadMap.bind(self);
		self.shadowRoot.appendChild(element2);

		self.shadowRoot.querySelector('input[name="submitButton"]').onclick = self.submit.bind(self);

		self.fetch();

	}

	initSummary() {

		let self = this;

		// TODO: waarom zijn dit niet gewoon attribs in de html
		let summary = document.createElement('textarea-with-counter-widget');
		summary.setAttribute('name', 'summary');
		summary.setAttribute('data-minLength', '20');  // TODO: configurabel
		summary.setAttribute('data-maxLength', '140'); // TODO: configurabel
		self.shadowRoot.querySelector('summary-container').appendChild(summary)

	}

	initOpenStadMap() {

		let self = this;

		let openStadMap = document.createElement('openstad-map-widget');

		openStadMap.setAttribute('isEditor', true);
		openStadMap.onEditorUpdate = function(location) {
			console.log(location)
		}

		self.shadowRoot.querySelector('openstad-map-container').appendChild(openStadMap)
		self.openStadMap = openStadMap;

		if (self.markerToBeSet) {
			self.openStadMap.createMarkers(self.markerToBeSet);
			self.markerToBeSet = undefined;
		}

	}
	
	fetch() {

		let self = this;

		if (!self.getAttribute('data-id')) return;

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = `{{apiUrl}}/api/site/{{siteId}}/idea/${self.getAttribute('data-id')}`
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

				// console.log('Request succeeded with JSON response', json);

				self.shadowRoot.querySelector('input[name="title"]').value = json.title;
				self.shadowRoot.querySelector('textarea-with-counter-widget').setAttribute('data-value', json.summary);
				self.shadowRoot.querySelector('html-editor-widget').setAttribute('data-value', json.description);

				if (json.position) {
					// TODO: los dit ff normaal op
					if (self.openStadMap) {
						self.openStadMap.createMarkers({ position: json.position, status: json.status });
					} else {
						self.markerToBeSet = { position: json.position, status: json.status };
					}
				}

				self.shadowRoot.querySelector('input[name="submitButton"]').disabled = false;

			})
			.catch(function (error) {
				console.log('Request failed', error);
			});
	}

	submit() {

		// todo: hij is nu alleen edit maar zzou ook new moeten kunnen

		let self = this;
		self.shadowRoot.querySelector('input[name="submitButton"]').disabled = true;

		
		let data = {
			title: self.shadowRoot.querySelector('input[name="title"]').value,
			summary: self.shadowRoot.querySelector('textarea-with-counter-widget').getValue(),
			description: self.shadowRoot.querySelector('html-editor-widget').getValue(),
		}

		let url = '{{apiUrl}}/api/site/{{siteId}}/idea/';
		let method = 'post';

		if (self.getAttribute('data-id')) {
			url += self.getAttribute('data-id');
			method = 'put'
		}
		url = url + '?access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40';
		fetch(url, {
			method: method,
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify(data),
		})
	 		.then(function (response) {
				if (response.status != 200) {
					throw response;
				}
				return response.json();
			})
			.then(function (json) {
				// console.log('Request succeeded with JSON response', json);
				if (self.getAttribute('data-id')) {
					self.fetch();
				} else {
					self.setAttribute('data-id', json.id);
				}
			})
			.catch(function (error) {
				alert('ERROR')
				self.fetch();
				console.log('Request failed', error);
			});
		
	}

	static get observedAttributes() { return ['data-id']; }

	attributeChangedCallback(name, oldValue, newValue) {
		let self = this;

		switch(name) {

		case 'data-id':
			self.fetch();
			break;
		}

		if (self.getAttribute('afterAttributeChangedCallback')) {
			eval(`${self.getAttribute('afterAttributeChangedCallback')}(self, name, oldValue, newValue)`);
		}


	}

}

customElements.define('edit-idea-widget', EditIdeaWidget);
