function initNumberButton(element) {

	var amount = parseInt(element.innerHTML);
	var value000 = parseInt(amount/100) || 0;
	var value00  = parseInt(amount/10) - value000;
	var value0   = amount - value000 * 100 - value00 * 10;

	var container = document.createElement('div');
	container.className = 'number-button';

	var numberContainer = document.createElement('div');
	numberContainer.className = 'number-plate-container';
	container.appendChild(numberContainer);

	var nr000 = document.createElement('div');
	nr000.className = 'number-plate';
	nr000.innerHTML = value000;
	numberContainer.appendChild(nr000);

	var nr00 = document.createElement('div');
	nr00.className = 'number-plate';
	nr00.innerHTML = value00;
	numberContainer.appendChild(nr00);

	var nr0 = document.createElement('div');
	nr0.className = 'number-plate';
	nr0.innerHTML = value0;
	numberContainer.appendChild(nr0);

	var parent = element.parentNode
	parent.removeChild(element);
	parent.appendChild(container);
	container.appendChild(element);

}


function updateNumberButton(element, value) {
	
}
