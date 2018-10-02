class TextareaWithCounter extends HTMLElement {

	constructor() {
		super();
		var template = document.createElement('template');
		template.innerHTML = `{% include "./textarea-with-counter.html" %}`;
		var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	}

	connectedCallback () {
		let self = this;
		self.shadowRoot.querySelector('textarea').name = self.getAttribute('data-name')
		self.shadowRoot.querySelector('textarea').innerHTML = self.getAttribute('data-value')

		self.initCharactersLeft();
		
	}

	getValue() {
		// TODO: set met data value en get met functie is niet consistent
		return this.shadowRoot.querySelector('textarea').value;
	}

  initCharactersLeft() {
		let self = this;

		// summary
		var minLength = parseInt(self.getAttribute('data-minLength')) || 140;
		var maxLength = parseInt(self.getAttribute('data-maxLength')) || 5000;
		
		var textarea  = self.shadowRoot.querySelector('textarea');
		var charsLeft = self.shadowRoot.querySelector('#charsLeft');

		if( !charsLeft ) {
			return;
		}

		var msg = {
			min: charsLeft.querySelector('div.min'),
			max: charsLeft.querySelector('div.max')
		};
		var span = {
			min: msg.min.querySelector('span'),
			max: msg.max.querySelector('span')
		};

		updateCharsLeft();
		
		textarea.addEventListener('focus', function( event ) {
			charsLeft.className += ' visible';
			updateCharsLeft()
		});

		textarea.addEventListener('blur', function( event ) {
			charsLeft.className = charsLeft.className.replace(' visible', '');
		});

		textarea.addEventListener('keyup', function() {
			updateCharsLeft();
		});
		
		function updateCharsLeft() {
			var length  = textarea.value.length;
			var enable  = length < minLength ? 'min' : 'max';
			var disable = enable == 'max' ? 'min' : 'max';
			var ok = enable == 'max' ? length < maxLength : length > minLength;
			var chars   = length < minLength ?
					minLength - length :
					maxLength - length;
			
			msg[enable].className  = enable + ' ' + ( ok ? 'ok' : 'error' ) + ' visible';
			msg[disable].className = disable;
			span[enable].innerHTML = chars;
		}

	}

	static get observedAttributes() { return ['data-value']; }

	attributeChangedCallback(name, oldValue, newValue) {
		let self = this;

		switch(name) {

			case 'data-value':
				self.shadowRoot.querySelector('textarea').innerHTML = self.getAttribute('data-value')
				break;
		}

		if (self.getAttribute('afterAttributeChangedCallback')) {
			eval(`${self.getAttribute('afterAttributeChangedCallback')}(self, name, oldValue, newValue)`);
		}


	}
	
}

customElements.define('textarea-with-counter-widget', TextareaWithCounter);
