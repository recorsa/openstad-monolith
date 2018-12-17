// ----------------------------------------------------------------------------------------------------
// budgeting functions

// config
var initialAvailableBudget = 300000;
var minimalBudgetSpent = 200000;

// vars
var availableBudgetAmount = initialAvailableBudget;
var currentBudgetSelection = openstadGetCookie('currentBudgetSelection') || [];

var currentStep = 1;
// TODO: dit is ff snel en moet anders
if (window.location.search.match(/returnFromLogin=true/)) {
	currentStep = 4;
}

function toggleIdeaInBudget(id) {
	var index = currentBudgetSelection.indexOf(id);
	if (index == -1) {
		addIdeaToBudget(id);
	} else {
		removeIdeaFromBudget(id);
	}
}

function addIdeaToBudget(id) {

	var element = sortedElements.find( el => el.ideaId == id );

	if (availableBudgetAmount >= element.budgetValue && currentBudgetSelection.indexOf(id) == -1) {
		currentBudgetSelection.push(id);
	}
	recalculateAvailableBudgetAmount();

	openstadSetCookie('currentBudgetSelection', currentBudgetSelection)

	scrollToBudget()
	
	updateBudgetDisplay();
	updateListElements();

}

function removeIdeaFromBudget(id) {

	var element = sortedElements.find( el => el.ideaId == id );
	var index = currentBudgetSelection.indexOf(id);

	currentBudgetSelection.splice(index, 1);
	recalculateAvailableBudgetAmount();

	openstadSetCookie('currentBudgetSelection', currentBudgetSelection)

	scrollToBudget()

	updateBudgetDisplay();
	updateListElements();

}

function recalculateAvailableBudgetAmount() {
	availableBudgetAmount = initialAvailableBudget;
	currentBudgetSelection.forEach((id) => {
		var element = sortedElements.find( el => el.ideaId == id );
		availableBudgetAmount -= element.budgetValue;
	});
}

var budgetingEditMode;

function setBudgetingEditMode() {

	var preview = document.querySelector('#current-budget-preview');
	var isChecked = document.querySelector('#budgeting-edit-mode').checked;

	if (isChecked) {
		addToClassName(preview, 'editMode');
		preview.querySelectorAll('.idea-image-mask').forEach((image) => {
			image.onclick = function() { removeIdeaFromBudget(image.ideaId) };
		});
	} else {
		removeFromClassName(preview, 'editMode');
		preview.querySelectorAll('.idea-image-mask').forEach((image) => {
			image.onclick = '';
		});
	}

}


function previousStep() {
	currentStep--;
	updateBudgetDisplay();
}

function nextStep() {

	if (currentStep == 1) {
		if (initialAvailableBudget - availableBudgetAmount < minimalBudgetSpent) {
			addError(document.querySelector('#current-budget-preview'), 'Je hebt nog niet voldoende plannen geselecteerd.')
			return;
		}
	}
	
	currentStep++;
	updateBudgetDisplay();

	if (currentStep == 3) {
		document.location.href = "/oauth/login?redirect_uri=/begroten?returnFromLogin=true";
	}

	if (currentStep == 5) {
		submitBudget();
	}

	if (currentStep == 6) {
		// klaar, nu alles weggooien
		currentBudgetSelection = [];
		openstadEraseCookie('currentBudgetSelection')
		openstadEraseCookie('hide-info-bewoners-west')
		openstadEraseCookie('lastSorted')
		openstadEraseCookie('plannenActiveTab')
		openstadEraseCookie('plannenActiveFilter')
		openstadEraseCookie('sortOrder')
	}

	if (currentStep == 7) {
		window.location.href = '/begroten'
	}
	
}

function updateBudgetDisplay() {

	// botte bijl - later een keer opschonen en generiek maken
	// ToDo: wat nu gecopy-paste dingen samenvoegen
	removeError(document.querySelector('#current-budget-preview'));

	var budgetBar = document.querySelector('#current-budget-bar').querySelector('.current-budget-images');
	var preview = document.querySelector('#current-budget-preview');
	var previewImages = document.querySelector('#current-budget-preview').querySelector('.current-budget-images');
	var previewTable = document.querySelector('#current-budget-preview').querySelector('.current-budget-table');

	// always update the budget bar
	var borderWidth = 3;
	var totalWidth = document.querySelector('#current-budget-bar').offsetWidth - borderWidth * ( currentBudgetSelection.length - 1 );
	currentBudgetSelection.forEach((id) => {
		var element = sortedElements.find( el => el.ideaId == id );
		var width = ( totalWidth * ( element.budgetValue / initialAvailableBudget ));
		var budgetBarImage = element.querySelector('.idea-image-mask').cloneNode(true);
		// todo: better width calculation
		budgetBarImage.style.width = width + 'px';
		budgetBar.appendChild(budgetBarImage)
	});
	
	budgetBar.innerHTML = '';
	currentBudgetSelection.forEach((id) => {
		var element = sortedElements.find( el => el.ideaId == id );
		var width = ( totalWidth * ( element.budgetValue / initialAvailableBudget ));
		var budgetBarImage = element.querySelector('.idea-image-mask').cloneNode(true);
		// todo: better width calculation
		budgetBarImage.style.width = width + 'px';
		budgetBar.appendChild(budgetBarImage)
	});
	var addButton = document.querySelector('#steps-content-1').querySelector('.add-button');
	previewImages.appendChild( addButton.cloneNode(true) )


	// text
	document.querySelector('#current-step').querySelector('#text').innerHTML = document.querySelector('#steps-content-' + currentStep).querySelector('.text').innerHTML;
	
	switch(currentStep) {

		case 1:

			removeFromClassName(previewImages, 'hidden');
			addToClassName(previewTable, 'hidden');

			document.querySelector('#current-budget-amount').innerHTML = formatEuros(initialAvailableBudget - availableBudgetAmount);
			document.querySelector('#available-budget-amount').innerHTML = formatEuros(availableBudgetAmount);

			previewImages.innerHTML = '';
			currentBudgetSelection.forEach((id) => {
				var element = sortedElements.find( el => el.ideaId == id );
				var previewImage = element.querySelector('.idea-image-mask').cloneNode(true);
				previewImage.ideaId = element.ideaId; // used by setBudgetingEditMode
				previewImages.appendChild(previewImage)
			});
			var addButton = document.querySelector('#steps-content-1').querySelector('.add-button');
			previewImages.appendChild( addButton.cloneNode(true) )

			if (currentBudgetSelection.length == 0) {
				document.querySelector('#budgeting-edit-mode').checked = false;
				addToClassName(document.querySelector('#budgeting-edit-mode-container'), 'hidden');
			} else {
				removeFromClassName(document.querySelector('#budgeting-edit-mode-container'), 'hidden');
			}
			setBudgetingEditMode()

			break;

		case 2:

			document.querySelector('#current-budget-amount').innerHTML = formatEuros(initialAvailableBudget - availableBudgetAmount);
			document.querySelector('#available-budget-amount').innerHTML = formatEuros(availableBudgetAmount);

			addToClassName(previewImages, 'hidden');
			removeFromClassName(previewTable, 'hidden');
			addToClassName(document.querySelector('#budgeting-edit-mode-container'), 'hidden');

			var overview = previewTable.querySelector('.overview');
			overview.innerHTML = '';
			currentBudgetSelection.forEach((id) => {
				var element = sortedElements.find( el => el.ideaId == id );
				overview.appendChild(element.querySelector('.idea-image-mask').cloneNode(true));
				overview.appendChild(element.querySelector('.title').cloneNode(true));
				overview.appendChild(element.querySelector('.budget').cloneNode(true));
			});
			
			break;

		case 3:

			document.querySelector('#current-budget-amount').innerHTML = formatEuros(initialAvailableBudget - availableBudgetAmount);
			document.querySelector('#available-budget-amount').innerHTML = formatEuros(availableBudgetAmount);

			addToClassName(previewImages, 'hidden');
			addToClassName(previewTable, 'hidden');

			break;


		case 4:

			document.querySelector('#current-budget-amount').innerHTML = formatEuros(initialAvailableBudget - availableBudgetAmount);
			document.querySelector('#available-budget-amount').innerHTML = formatEuros(availableBudgetAmount);

			addToClassName(previewImages, 'hidden');
			addToClassName(previewTable, 'hidden');
			break;

		case 5:
			break;

		case 6:
			break;
			

	}

	updateBudgetNextButton();
	
}

function updateBudgetNextButton() {

	var previousButton = document.querySelector('#previous-button');
	var nextButton = document.querySelector('#next-button');

	switch(currentStep) {

		case 1:
			addToClassName(previousButton, 'hidden');
			nextButton.innerHTML = 'Volgende';
			if (initialAvailableBudget - availableBudgetAmount > minimalBudgetSpent) {
				addToClassName(nextButton, 'active')
			} else {
				removeFromClassName(nextButton, 'active')
			}
			
			break;

		case 2:
			nextButton.innerHTML = 'Vul je stemocode in';
			removeFromClassName(previousButton, 'hidden');
			removeFromClassName(nextButton, 'hidden');
			break;

		case 3:
			break;

		case 4:
			nextButton.innerHTML = 'Stuur je stem op';
			addToClassName(previousButton, 'hidden');
			removeFromClassName(nextButton, 'hidden');
			addToClassName(nextButton, 'active');

		case 5:
			break;

		case 6:
			nextButton.innerHTML = 'Klaar';
			addToClassName(previousButton, 'hidden');
			removeFromClassName(nextButton, 'hidden');
			addToClassName(nextButton, 'active');
	}
	
}

function submitBudget() {
	alert('ToDo');
	nextStep();
}

function addError(element, text) {
	addToClassName(element, 'error');
	element.setAttribute('data-error-content', text);
}

function removeError(element, text) {
	removeFromClassName(element, 'error');
	element.setAttribute('data-error-content', '');
}

// end budgeting functions
// ----------------------------------------------------------------------------------------------------
// sort functions

var sortOrder = openstadGetCookie('sortOrder') || 'random';
var lastSorted = openstadGetCookie('lastSorted');

var sortedElements = [];

(function() {
	initSortedElements()
	document.querySelector('#selectSort').value = sortOrder;
	doSort(sortOrder)
})();

function initSortedElements() {

	var elements = document.getElementsByClassName('gridder-list');

	Array.prototype.forEach.call(elements, function(element) {
		var id = element.id.match(/idea-(\d+)/)[1];
		element.ideaId = parseInt(id);
		element.budgetValue = parseInt( element.querySelector('.budget-value').innerHTML ); // easier to use later
		element.querySelectorAll('.budget').forEach( el => el.innerHTML = formatEuros(el.innerHTML) );
		sortedElements.push(element);
	});

	if (lastSorted) {
		sortedElements = sortedElements.sort( (a,b) => lastSorted.indexOf(a.ideaId) - lastSorted.indexOf(b.ideaId) );
	} else {
		lastSorted = [];
		sortedElements.forEach( element  => {
			lastSorted.push(element.ideaId);
		});
		openstadSetCookie('lastSorted', lastSorted);
	}

	updateList();
	
}

function doSort(which) {

	sortOrder = which;
	openstadSetCookie('sortOrder', sortOrder);

	switch(sortOrder){
		case 'random':
			sortedElements = sortedElements.sort( (a,b) => lastSorted.indexOf(a.ideaId) - lastSorted.indexOf(b.ideaId) );
			break;
		case 'budget-up':
			sortedElements = sortedElements.sort( (a,b) => b.querySelector('.budget-value').innerHTML - a.querySelector('.budget-value').innerHTML );
			break;
		case 'budget-down':
			sortedElements = sortedElements.sort( (a,b) => a.querySelector('.budget-value').innerHTML - b.querySelector('.budget-value').innerHTML );
			break;
	}

	updateList();

}

// end sort functions
// ----------------------------------------------------------------------------------------------------
// tab selector functions

var activeTab = openstadGetCookie('plannenActiveTab') || 0;
var activeFilter = openstadGetCookie('plannenActiveFilter') || 0;

(function() {
	activateTab(activeTab)
	activateFilter(activeFilter)
})();

function activateTab(which) {
	gridderClose();
	removeFromClassName(document.getElementById('themaSelector' + activeTab), 'active');
	activeTab = which;
	openstadSetCookie('plannenActiveTab', activeTab);
	addToClassName(document.getElementById('themaSelector' + activeTab), 'active');
	updateList();
}

function activateFilter(which) {
	gridderClose();
	activeFilter = which;
	openstadSetCookie('plannenActiveFilter', activeFilter);
	document.getElementById('filterSelector').selectedIndex = activeFilter;
	if (document.getElementById('filterSelector').selectedIndex == '0') {
		document.getElementById('filterSelector').options[0].innerHTML = 'Filter op gebied';
	} else {
		document.getElementById('filterSelector').options[0].innerHTML = 'Alle gebieden';
	}
	updateList();
}

function deactivateAll() {
	activateTab(0)
	activateFilter(0)
}

// end tab selector functions
// ----------------------------------------------------------------------------------------------------
// update list display functions

// update list after sort or tab selection
function updateList() {

	var activeThema = document.getElementById('themaSelector' + activeTab) ? document.getElementById('themaSelector' + activeTab).innerHTML : '';
	var activeGebied = document.getElementById('filterSelector').value ? document.getElementById('filterSelector').value : '';

	// show only the selected elements; display: none does not work well with gridder
	document.querySelector('#ideaList').innerHTML = '';
	sortedElements.forEach( element => {
		var elementThema = element.querySelector('.thema') && element.querySelector('.thema').innerHTML;
		var elementGebied = element.querySelector('.gebied') && element.querySelector('.gebied').innerHTML;
		if ((( !activeTab || activeTab == 0 ) || activeThema == elementThema) && (( !activeFilter || activeFilter == 0 ) || activeGebied == elementGebied)) {
			document.querySelector('#ideaList').appendChild(element)
		}
	});

	updateListElements()
	
}

// update list elements after changes in budget
function updateListElements() {

	// update add and budget buttons in list
	sortedElements.forEach( element => {
		updateElement(element);
	});

	// update add and budget buttons in gridder-show
	var gridderShow = document.querySelector('.gridder-show');
	if (gridderShow) {
		gridderShow.ideaId = parseInt( gridderShow.querySelector('.this-idea-id').innerHTML );
		updateElement(gridderShow);
	};

	function updateElement(element) {
		// is added to the budgetting selection
		if (currentBudgetSelection.indexOf( element.ideaId ) != -1) {
			element.querySelectorAll('.button-add-idea-to-budget').forEach( el => addToClassName(el, 'added') );
		} else {
			element.querySelectorAll('.button-add-idea-to-budget').forEach( el => removeFromClassName(el, 'added') );

			// is available, i.e. amount is smaller than the available budget
			if (element.budgetValue > availableBudgetAmount) {
				element.querySelectorAll('.budget').forEach( el => addToClassName(el, 'unavailable') );
				element.querySelectorAll('.button-add-idea-to-budget').forEach( el => addToClassName(el, 'unavailable') );
			} else {
				element.querySelectorAll('.budget').forEach( el => removeFromClassName(el, 'unavailable') );
				element.querySelectorAll('.button-add-idea-to-budget').forEach( el => removeFromClassName(el, 'unavailable') );
			}
		}
	}

}

// end update list display functions
// ----------------------------------------------------------------------------------------------------
// gridder / list functions

function handleClick(event) {

	// search for the element clicked
	var target = event.target;
	var ideaElement;
	var buttonReadMore;
	var buttonAddIdeaToBudget;

	while ( target.tagName != 'HTML' ) {
		if ( target.className.match('gridder-list') ) {
			ideaElement = target;
			break;
		}
		if ( target.className.match(/button-add-idea-to-budget/) ) {
			buttonAddIdeaToBudget = target;
		}
		if ( target.className.match('button-read-more') ) {
			buttonReadMore = target;
		}
		target = target.parentNode || target.parentElement;
	}

	if (ideaElement) {

		// if button == 'more info' use gridder
		if (buttonReadMore) {
			return;
		}

		// if button == 'add to budget'
		if (buttonAddIdeaToBudget) {
			var ideaId = ideaElement.ideaId;
			if (ideaId) {
				toggleIdeaInBudget(ideaId)
			}
		}

		// cancel gridder
		event.stopPropagation()
		event.stopImmediatePropagation()

	}

}

function gridderClose() {
	var element = document.querySelector('.gridder-close');
	if (element) {
		element.click();
	}
}

window.onload = function() { // using (function {} {})() happens too early
	var showIdeaId;
	var match = window.location.search.match(/showIdea=(\d+)/);
	if (match) {
		showIdeaId = match[1];
	};
	var match = window.location.hash.match(/showidea-(\d+)/);
	if (match) {
		showIdeaId = match[1];
	};
	if (showIdeaId && document.querySelector('#idea-' + showIdeaId) && document.querySelector('#idea-' + showIdeaId).querySelector('.button-read-more')) {
		document.querySelector('#idea-' + showIdeaId).querySelector('.button-read-more').click()
	}
};

// end gridder / list functions
// ----------------------------------------------------------------------------------------------------
// infoblock

function showInfoBewonersWest() {
	document.querySelector('#info-bewoners-west').style.display = 'block';
}

function hideInfoBewonersWest() {
	document.querySelector('#info-bewoners-west').style.display = 'none';
	openstadSetCookie('hide-info-bewoners-west', true);
}

(function() {
	if (!openstadGetCookie('hide-info-bewoners-west')) {
		showInfoBewonersWest();
	}
})();

// end infoblock
// ----------------------------------------------------------------------------------------------------
// other

function addToClassName(element, className) {
	if (element) {
		if (!element.className.match(new RegExp(' ?' + className + '(?: |$)' ))) {
			element.className += ' ' + className;
		}
	}
}

function removeFromClassName(element, className) {
	// if (element) {
		element.className = element.className.replace(new RegExp(' ?' + className + '(?: |$)' ), '');
	// }
}

function formatEuros(amount) {
	
	// todo: nu hardcoded want max 300K
	amount = parseInt(amount);
	let thousends = parseInt(amount/1000);
	let rest = ( amount - 1000 * thousends ).toString();
	if (rest.length < 3) rest = '0' + rest;
	if (rest.length < 3) rest = '0' + rest;
	return '€ ' +  thousends + '.' + rest;
}

function scrollToIdeas() {
  scrollToResolver(document.querySelector('.tab-selector'));
}

function scrollToBudget() {
  scrollToResolver(document.querySelector('#budget-block'));
}

function scrollToResolver(elem) {
  var jump = parseInt(elem.getBoundingClientRect().top * .2);
  document.body.scrollTop += jump;
  document.documentElement.scrollTop += jump;
  if (!elem.lastjump || elem.lastjump > Math.abs(jump)) {
    elem.lastjump = Math.abs(jump);
    setTimeout(function() { scrollToResolver(elem);}, 25);
  } else {
    elem.lastjump = null;
  }
}

// end other
// ----------------------------------------------------------------------------------------------------
// init

recalculateAvailableBudgetAmount();

updateBudgetDisplay();

// dev
// if (currentBudgetSelection.length == 0) {
//  	addIdeaToBudget(17)
//  	addIdeaToBudget(31)
//  	addIdeaToBudget(30)
// }

// end init
// ----------------------------------------------------------------------------------------------------
// TAF
