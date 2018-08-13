class ArgumentsWidget extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback () {
    let href = this.getAttribute('href') || '';
    this.innerHTML = `{% include './list.njk' %}`
  }
}

customElements.define('arguments-widget', ArgumentsWidget);

