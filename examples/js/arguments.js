function initArgumentsForm(argumentsElement, argumentsFormElement) {

	let newForm1 = document.createElement('arguments-form-widget');
	newForm1.innerHTML = argumentsFormElement.innerHTML;
	let parent = argumentsElement.getElementsByTagName('arguments-for')[0];
	parent.insertBefore( newForm1, parent.firstChild );

	let newForm2 = document.createElement('arguments-form-widget');
	newForm2.innerHTML = argumentsFormElement.innerHTML;
	parent = argumentsElement.getElementsByTagName('arguments-against')[0];
	parent.insertBefore( newForm2, parent.firstChild );

	argumentsFormElement.parentNode.removeChild(argumentsFormElement);

}
