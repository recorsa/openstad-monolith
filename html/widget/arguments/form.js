var doc = document.currentScript.ownerDocument;

class ArgumentFormWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./form.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {

		var self = this;
		self.shadowRoot.querySelector('input[name="submitButton"]').onclick = self.submit.bind(self);

		if (self.getAttribute('data-css')) {
			console.log('extra CSS')
			let link = document.createElement('link');
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = self.getAttribute('data-css');
			self.shadowRoot.appendChild(link)
		}

	}

	submit() {

		// todo: hij is nu alleen edit maar zzou ook new moeten kunnen

		let self = this;
		self.shadowRoot.querySelector('input[name="submitButton"]').disabled = true;

		let data = {
			description: self.shadowRoot.querySelector('textarea[name="description"]').value,
			sentiment: self.getAttribute('data-sentiment')
		}

		{% if extraFields %}
		{% for field in extraFields %}
		data.{{field.name}} = self.shadowRoot.querySelector('input[name="{{field.name}}"]').value;
		{% endfor %}
		{% endif %}

		// console.log(data);

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = '{{apiUrl}}/api/site/{{site.id}}/idea';
		if (self.getAttribute('data-idea-id')) {
			url += '/' + self.getAttribute('data-idea-id');
		} else {
			// stomtool, todo
			url += '/1'
		}
		url += '/argument';
		url = url + '?access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40';
		// console.log(url)
		
		fetch(url, {
			method: 'post', // TDO: edit
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify(data),
		})
	 		.then(function (response) {
				// console.log(response)
				return response.json();
			})
			.then(function (json) {
				// console.log('Request succeeded with JSON response', json);
				self.shadowRoot.querySelector('textarea[name="description"]').value = '';
				self.shadowRoot.querySelector('input[name="submitButton"]').disabled = false;
			})
			.catch(function (error) {
				alert('ERROR')
				// console.log('Request failed', error);
			});
		
	}

}

customElements.define('argument-form-widget', ArgumentFormWidget);
