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

		// console.log('1',self.getAttribute('data-css'))

		if (self.getAttribute('data-css')) {
			var link  = document.createElement('link');
			link.rel  = 'stylesheet';
			link.type = 'text/css';
			link.href = self.getAttribute('data-css');
		  // console.log('2',link)
			self.shadowRoot.appendChild(link);
		}

		self.shadowRoot.querySelector('input[name="submitButton"]').onclick = self.submit.bind(self);

	}

	submit() {

		// todo: hij is nu alleen edit maar zzou ook new moeten kunnen

		let self = this;
		self.shadowRoot.querySelector('input[name="submitButton"]').disabled = true;

		let data = {
			description: self.shadowRoot.querySelector('textarea[name="description"]').value,
			_csrf: self.shadowRoot.querySelector('input[name="_csrf"]').value,
		}

		{% if extraFields %}
		{% for field in extraFields %}
		data.{{field}} = self.shadowRoot.querySelector('input[name="{{field}}"]').value;
		{% endfor %}
		{% endif %}

		// console.log(data);

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = '{{apiUrl}}/api/site/{{site.id}}/idea';
		if (self.getAttribute('data-idea-id')) {
			url += '/' + self.getAttribute('data-idea-id');
		}
		url += '/argument';
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
			})
			.catch(function (error) {
				alert('ERROR')
				// console.log('Request failed', error);
			});
		
	}

}

customElements.define('argument-form-widget', ArgumentFormWidget);
