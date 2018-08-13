// web component definition
class IdeaWidget extends HTMLElement {

	constructor() {
		super();
	}

	connectedCallback () {
		let href = this.getAttribute('href') || '';
		this.innerHTML = `{% include './idea.njk' %}`
	}

}
customElements.define('idea-widget', IdeaWidget);


// vote function
function doVote(what) {

	// TODO: ik denk eigenlijk dat je een stem moet kunnen cancellen, zo werkt het nu tenminste

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
				if (result.voteRemoved) {
					document.getElementById('idea-votes-for-button').className = document.getElementById('idea-votes-against-button').className.replace(/ ?selected/g, '');
					document.getElementById('idea-votes-against-button').className = document.getElementById('idea-votes-against-button').className.replace(/ ?selected/g, '');
				} else {
					if (what == 'yes') {
						if ( document.getElementById('idea-votes-for-button').className.search(/selected/) == -1) {
							document.getElementById('idea-votes-for-button').className = document.getElementById('idea-votes-for-button').className + ' selected';
						}
						document.getElementById('idea-votes-against-button').className = document.getElementById('idea-votes-against-button').className.replace(/ ?selected/g, '');
					} else {
						document.getElementById('idea-votes-for-button').className = document.getElementById('idea-votes-for-button').className.replace(/ ?selected/g, '');
						if ( document.getElementById('idea-votes-against-button').className.search(/selected/) == -1) {
							document.getElementById('idea-votes-against-button').className = document.getElementById('idea-votes-against-button').className + ' selected';
						}
					}
				}
      } else {
				// todo
        alert('error');
      }
    }
  };

  xmlhttp.open("POST", '{{ voteUrl }}', true);
	xmlhttp.setRequestHeader('Content-type', 'application/json');
	xmlhttp.setRequestHeader('Accept', 'application/json');
  xmlhttp.send(JSON.stringify({
		"opinion": what,
		"_csrf": "{{ csrfToken }}"
	}));

}
