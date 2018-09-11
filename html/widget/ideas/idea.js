class IdeaWidget extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./idea.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {
		let self = this;

		if (self.getAttribute('data-css')) {
			var link  = document.createElement('link');
			link.rel  = 'stylesheet';
			link.type = 'text/css';
			link.href = self.getAttribute('data-css');
			self.shadowRoot.appendChild(link);
		}
		
		if (self.getAttribute('data-id')) {
			self.fetch();
		}

		self.setAttribute('testValue', 'before')

	}

	fetch() {
		let self = this;

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = `{{apiUrl}}/api/site/{{siteId}}/idea/${self.getAttribute('data-id')}?includePosterImage=true&includeVoteCount=true&includeUserVote=true`
		
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
				self.render(json)

				if (self.getAttribute('afterFetchCallback')) {
					eval(`${self.getAttribute('afterFetchCallback')}(self)`);
				}

			})
			.catch(function (error) {
				// console.log('Request failed', error);
			});
	}


	render(data) {

		let self = this;

		self.shadowRoot.querySelector('idea').id = data.id;
		self.shadowRoot.querySelector('idea-title').innerHTML = data.title;
		self.shadowRoot.querySelector('idea-description').innerHTML = data.description;
		self.shadowRoot.querySelector('idea-image').style = `background-image: url(${data.posterImageUrl})`;
		self.shadowRoot.querySelector('idea-counters').innerHTML = `${data.yes}, ${data.no}, ${data.argCount}`;

		self.setAttribute("data-votes-yes", data.yes);
		self.shadowRoot.querySelector('idea-votes-for-button').setAttribute("data-value", data.yes);
		self.setAttribute("data-votes-no", data.no);
		self.shadowRoot.querySelector('idea-votes-for-button').className = data.userVote && data.userVote.opinion == 'yes' ? 'selected' : '';
		self.shadowRoot.querySelector('idea-votes-against-button').setAttribute("data-value", data.no);
		self.shadowRoot.querySelector('idea-votes-against-button').className = data.userVote && data.userVote.opinion == 'no' ? 'selected' : '';

		self.setAttribute('testValue', 'after')

		if (self.getAttribute('afterRenderCallback')) {
			eval(`${self.getAttribute('afterRenderCallback')}(self)`);
		}

	}

	/// todo: cleanup
	static get observedAttributes() {return ['data-id', 'data-votes-yes', 'data-votes-no']; }

	attributeChangedCallback(name, oldValue, newValue) {
		let self = this;

		if (name == 'data-id') {
			self.fetch();
		}

		if (name == 'data-votes-yes') {
			self.shadowRoot.querySelector('idea-votes-for-button').setAttribute("data-value", newValue);
		}

		if (name == 'data-votes-no') {
			self.shadowRoot.querySelector('idea-votes-against-button').setAttribute("data-value", newValue);
		}

		if (self.getAttribute('afterAttributeChangedCallback')) {
			eval(`${self.getAttribute('afterAttributeChangedCallback')}(self, name, oldValue, newValue)`);
		}

	}

}

customElements.define('idea-widget', IdeaWidget);

// vote function
function doVote(what) {

	// TODO: ik denk eigenlijk dat je een stem moet kunnen cancellen, zo werkt het nu tenminste

	let element = document.querySelector('idea-widget');
	let root = element.shadowRoot;
	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == XMLHttpRequest.DONE) {
			if (xmlhttp.status == 200) {
				let result = xmlhttp.responseText;
				try {
					result = JSON.parse(result);
				} catch(err) {
					result = '';
				}
				if (result.result == 'cancelled') {
					if (what == 'yes') {
						element.setAttribute("data-votes-yes", parseInt( element.getAttribute("data-votes-yes") ) - 1);
					} else {
						element.setAttribute("data-votes-no", parseInt( element.getAttribute("data-votes-no") ) - 1);
					}
					root.getElementById('idea-votes-for-button').className = root.getElementById('idea-votes-against-button').className.replace(/ ?selected/g, '');
					root.getElementById('idea-votes-against-button').className = root.getElementById('idea-votes-against-button').className.replace(/ ?selected/g, '');
				} else {
					if (what == 'yes') {
						element.setAttribute("data-votes-yes", parseInt( element.getAttribute("data-votes-yes") ) + 1);
						if (result.result == 'replaced') {
							element.setAttribute("data-votes-no", parseInt( element.getAttribute("data-votes-no") ) -1);
						}
						if ( root.getElementById('idea-votes-for-button').className.search(/selected/) == -1) {
							root.getElementById('idea-votes-for-button').className = root.getElementById('idea-votes-for-button').className + ' selected';
						}
						root.getElementById('idea-votes-against-button').className = root.getElementById('idea-votes-against-button').className.replace(/ ?selected/g, '');
					} else {
						element.setAttribute("data-votes-no", parseInt( element.getAttribute("data-votes-no") ) + 1);
						if (result.result == 'replaced') {
							element.setAttribute("data-votes-yes", parseInt( element.getAttribute("data-votes-yes") ) -1);
						}
						root.getElementById('idea-votes-for-button').className = root.getElementById('idea-votes-for-button').className.replace(/ ?selected/g, '');
						if ( root.getElementById('idea-votes-against-button').className.search(/selected/) == -1) {
							root.getElementById('idea-votes-against-button').className = root.getElementById('idea-votes-against-button').className + ' selected';
						}
					}
				}
			} else {
				// todo
				alert('error');
			}
		}
	};

	let url = '{{ voteUrl }}';
	url = url.replace('[[id]]', element.getAttribute('data-id'))

	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('Content-type', 'application/json');
	xmlhttp.setRequestHeader('Accept', 'application/json');
	xmlhttp.send(JSON.stringify({
		"opinion": what,
		"_csrf": "{{ csrfToken }}"
	}));

}
