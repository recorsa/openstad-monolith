 class NumberButtonWidget extends HTMLElement {

	 constructor() {
		 super();
		 var template = document.createElement('template');
		 template.innerHTML = `
			 <style>
				* {
				box-sizing: border-box;
				}
			 
				number-button {
				position: relative;
				display: flex;
				flex-wrap: wrap;
				width: 88px;
				height: 43px;
				padding: 7px 6px 7px 10px;
				font-size: 18px;
				font-weight: 600;
				text-decoration: none;
				color: #fff;
				background: #004699;
				}
			 
				.number-plate {
				display: inline-block;
				width: 20px;
				height: 29px;
				margin-right: 4px;
				padding: 0;
				border-radius: 3px;
				font-size: 18px;
				font-weight: 800;
				line-height: 31px;
				text-align: center;
				vertical-align: middle;
				color: black;
				background: #e8e8e8;
				background: linear-gradient(#e8e8e8 50%, #ffffff 50%);
				}
				
			 </style>
			 
			 <number-button>
				<div id="number-plate-000" class="number-plate">0</div>
				<div id="number-plate-00" class="number-plate">0</div>
				<div id="number-plate-0" class="number-plate">0</div>
			 </number-button>
		 `;
		 var shadowRoot = this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
	 }

	 static get observedAttributes() {return ['data-value']; }

	 connectedCallback () {
		 // this.shadowRoot.querySelector('idea-controls').innerHTML = 'Knoppen'
		 var href = this.getAttribute('href') || '';
		 this.updateValue();
	 }

	 updateValue(value) {

		 var self = this;

		 var value000 = parseInt(value/100) || 0;
		 var value00  = parseInt(value/10) - value000;
		 var value0   = value - value000 * 100 - value00 * 10;

		 self.shadowRoot.querySelector('#number-plate-000').innerHTML = value000;
		 self.shadowRoot.querySelector('#number-plate-00').innerHTML = value00;
		 self.shadowRoot.querySelector('#number-plate-0').innerHTML = value0;

	 }

	 attributeChangedCallback(name, oldValue, newValue) {
		 // console.log('attributeChange', name, oldValue, newValue)
		 if (name == 'data-value') {
			 this.updateValue(newValue);
		 }
	 }

 }

 customElements.define('number-button-widget', NumberButtonWidget);
