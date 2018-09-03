// Idea form extensions
// --------------------
// Used by poster file upload and description editor to register
// a reference to each uploaded file. This reference list is used
// by the server to connect the correct image uploads to this idea.
var form = document.getElementById('js-form');
form.addAttachmentRef = function( key ) {
	var input   = document.createElement('input');
	input.type  = 'hidden';
	input.name  = 'images[]';
	input.value = key;
	this.appendChild(input);
};
form.clearAttachmentRef = function() {
	var images = Array.prototype.slice.call(
		form.querySelectorAll('input[name="images[]"]'), 0
	);
	images.forEach(function( image ) {
		this.removeChild(image);
	}, this);
};
form.addEventListener('submit', function( event ) {
	var uploadForm = document.getElementById('posterImageUpload');
	if( !uploadForm ) return;
	
	if( uploadForm.classList.contains('uploading') ) {
		event.stopPropagation();
		event.preventDefault();
		alert(
			'De afbeelding upload is nog niet afgerond.\n\n'+
				'Hierdoor kan uw idee nog niet opgeslagen worden.'
		);
	}
});

var currentImage;
var form        = document.getElementById('js-form');
var imageEditor = document.getElementById('image-editor');
var el          = document.getElementById('posterImageUpload');
var button      = imageEditor.querySelector('button');
var background = imageEditor.querySelector('#background');
var zoombuttons = imageEditor.querySelector('#zoombuttons');
var message      = imageEditor.querySelector('message');
var progressBar = el.querySelector('#posterImageUpload .progress .bar');
var cropperStatus = {};

var cropperWidth = 500;
var cropperHeight = 200;

var cropperContainer = document.getElementById('image-cropper-container');
var cropper = document.getElementById('image-cropper');

button.addEventListener('click', function() {
	removeCropper();
	upload.removeFile(currentImage || {});
});

var upload = new Dropzone(el, {
	maxFiles             : 1,
	uploadMultiple       : false,
	
	maxFilesize          : 10,
	maxThumbnailFilesize : 10,
	thumbnailWidth       : 1800,
	thumbnailHeight      : null,

	init: function(x) {
		let imageElem = document.getElementById('images')
		if (imageElem) {
			cropper.setAttribute('src', '/image/' + imageElem.value);
			initCropper()
		}
	},
	
	addedfile: function( file ) {

		this.removeFile(currentImage || {});
		currentImage = file;
		
		el.classList.add('uploading');
		progressBar.style.width = 0;
		
		file.key = Date.now()+'-'+file.name;
		this.options.params['key'] = file.key;
	},

	removedfile: function( file ) {
		el.removeAttribute('style');
		el.classList.remove('uploading');
		form.clearAttachmentRef();
	},
	
	thumbnail: function( file, dataURL ) {
		el.setAttribute('style', 'background-image: url('+dataURL+')');
		cropper.setAttribute('src', dataURL);
	},

	sending: function() {
		button.innerHTML = 'Annuleer upload';
	},

	uploadprogress: function( file, progress, bytesSent ) {
		progressBar.style.width = progress+'%';
	},
	
	success: function( file ) {
		el.classList.remove('uploading');
		form.addAttachmentRef(file.key);
		button.innerHTML = 'Verwijder afbeelding';
		initCropper(file);
	},

	error: function( file, error ) {
		button.innerHTML = 'Verwijder afbeelding';
		this.removeFile(file);
		if( typeof error != 'string' ) {
			alert(error.message);
		}
	},

});

function initCropper(file) {

	el.style.display = 'none';
	button.style.display = 'block';
	background.style.display = 'block';
	zoombuttons.style.display = 'block';
	message.style.display = 'block';

	// dit doet de css nu
	// cropperContainer.style.width  = cropperWidth  + 'px';
	// cropperContainer.style.height = cropperHeight + 'px';
	// cropperContainer.style.left   = parseInt( ( cropperContainer.parentNode.offsetWidth  - cropperWidth  ) / 2 ) + 'px';
	// cropperContainer.style.top    = parseInt( ( cropperContainer.parentNode.offsetHeight - cropperHeight ) / 2 ) + 'px';

	if (document.getElementById('imageExtraData').value) {
		cropperStatus = JSON.parse(document.getElementById('imageExtraData').value)
		console.log(cropperStatus);
	} else {

		var width = file.width;
		var height = file.height;

		var newWidth, newHeight, newX, newY;
		if (cropperWidth/cropperHeight > width/height) {
			newWidth = cropperWidth;
			newHeight = parseInt((cropperWidth/width) * height);
			newX = 0;
			newY = ( cropperHeight - newHeight ) / 2;
		} else {
			newHeight = cropperHeight;
			newWidth = parseInt((cropperHeight/height) * width);
			newX = ( cropperWidth - newWidth ) / 2;
			newY = 0;
		}

		cropperStatus.orgWidth  = width;
		cropperStatus.orgHeight = height;

		cropperStatus.width  = newWidth;
		cropperStatus.height = newHeight;
		cropperStatus.top    = newY;
		cropperStatus.left   = newX;

		cropperStatus.zoom = parseInt( 1000 * cropperStatus.width / cropperStatus.orgWidth );

	}

	cropper.style.width  = cropperStatus.width + 'px';
	cropper.style.height = cropperStatus.height + 'px';
	cropper.style.top    = cropperStatus.top + 'px';
	cropper.style.left   = cropperStatus.left + 'px';

	cropper.addEventListener('mousedown', initDrag);

	cropperContainer.className = '';

	updateExtraDataFormField()

}

function removeCropper() {
	el.style.display = 'block';
	button.style.display = 'none';
	background.style.display = 'none';
	zoombuttons.style.display = 'none';
	message.style.display = 'none';
	cropperContainer.className = 'hidden';
}

function initDrag(event) {

	event.preventDefault();

	cropperStatus.event = {};
	cropperStatus.event.lastX = event.clientX;
	cropperStatus.event.lastY = event.clientY;

	document.onmouseup		 = endDrag;
	document.onmousemove	 = doDrag;

	return false;

}

function doDrag(event) {

	event.preventDefault();

	var diffX = event.clientX - cropperStatus.event.lastX;
	var diffY = event.clientY - cropperStatus.event.lastY;

	cropperStatus.event.lastX = event.clientX;
	cropperStatus.event.lastY = event.clientY;

	moveImage(diffX, diffY);

	return false;

}

function endDrag(event) {

	event.preventDefault();

	cropperStatus.event = {};

	document.onmouseup		 = null;
	document.onmousemove	 = null;

	return false;

}

function doZoomIn() {

	var newZoom = parseInt( cropperStatus.zoom * 1.1 );

	var newWidth  = cropperStatus.orgWidth  * ( newZoom / 1000 );
	var newHeight = cropperStatus.orgHeight * ( newZoom / 1000 );

	cropperStatus.zoom = newZoom;

	drawZoom(newWidth, newHeight);

}

function doZoomOut() {

	var newZoom = parseInt( cropperStatus.zoom / 1.1 );

	var newWidth  = cropperStatus.orgWidth  * ( newZoom / 1000 );
	var newHeight = cropperStatus.orgHeight * ( newZoom / 1000 );

	if (newWidth < cropperWidth) {
		newZoom = parseInt( 1000 * cropperWidth / cropperStatus.orgWidth );
		newWidth  = cropperStatus.orgWidth  * ( newZoom / 1000 );
		newHeight = cropperStatus.orgHeight * ( newZoom / 1000 );
	}

	if (newHeight < cropperHeight) {
		newZoom = parseInt( 1000 * cropperHeight / cropperStatus.orgHeight );
		newWidth  = cropperStatus.orgWidth  * ( newZoom / 1000 );
		newHeight = cropperStatus.orgHeight * ( newZoom / 1000 );
	}

	cropperStatus.zoom = newZoom;

	drawZoom(newWidth, newHeight);

}

function drawZoom(newWidth, newHeight) {

	var diffX = ( cropperStatus.width - newWidth ) / 2;
	var diffY = ( cropperStatus.height - newHeight ) / 2;

	cropperStatus.width  = newWidth;
	cropperStatus.height = newHeight;

	cropper.style.width  = cropperStatus.width  + 'px';
	cropper.style.height = cropperStatus.height + 'px';

	moveImage(diffX, diffY);
	
}

function moveImage(diffX, diffY) {

	var newTop = cropperStatus.top + diffY;
	if (newTop > 0) newTop = 0;
	if (newTop + cropperStatus.height < cropperHeight) newTop = cropperHeight - cropperStatus.height;

	var newLeft = cropperStatus.left + diffX;
	if (newLeft > 0) newLeft = 0;
	if (newLeft + cropperStatus.width < cropperWidth) newLeft = cropperWidth - cropperStatus.width;

	cropperStatus.top  = newTop;
	cropperStatus.left = newLeft;

	cropper.style.top  = cropperStatus.top  + 'px';
	cropper.style.left = cropperStatus.left + 'px';

	updateExtraDataFormField();
	
}

function updateExtraDataFormField() {
	document.getElementById('imageExtraData').value = JSON.stringify(cropperStatus);
}
