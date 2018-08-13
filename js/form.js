function initCharactersLeft(target, contentDiv, minLen, maxLen) {

	var msg = {
		min: contentDiv.querySelector('div.min'),
		max: contentDiv.querySelector('div.max')
	};
	var span = {
		min: msg.min.querySelector('span'),
		max: msg.max.querySelector('span')
	};

	updateCharsLeft();
	
	target.addEventListener('focus', function( event ) {
		contentDiv.className += ' visible';
	});

	target.addEventListener('blur', function( event ) {
		contentDiv.className = contentDiv.className.replace(' visible', '');
	});

	target.addEventListener('keyup', function() {
		updateCharsLeft();
	});
	
	function updateCharsLeft() {
		var len     = target.value.length;
		var enable  = len < minLen ? 'min' : 'max';
		var disable = enable == 'max' ? 'min' : 'max';
		var ok = enable == 'max' ? len < maxLen : len > minLen;
		var chars   = len < minLen ?
			    minLen - len :
			    maxLen - len;
		
		msg[enable].className  = enable + ' ' + ( ok ? 'ok' : 'error' ) + ' visible';
		msg[disable].className = disable;
		span[enable].innerHTML = chars;
	}

}
