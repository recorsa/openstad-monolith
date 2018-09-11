class ArgumentsFormWidget extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback () {
    let href = this.getAttribute('href') || '';
    this.innerHTML = `{% include './form.njk' %}`
  }
}

customElements.define('arguments-form-widget', ArgumentsFormWidget);

