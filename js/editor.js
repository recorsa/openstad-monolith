function initAttachmentManager( form, editor ) {
	var host   = '/image';
	// {key: true, ...}
	var images = {};
	
	// document.addEventListener('trix-file-accept', function( event ) {
	// 	// Prevent attaching .png files
	// 	if( event.file.type === 'image/png' ) {
	// 		event.preventDefault();
	// 	}
	// 	// Prevent attaching files > 1024 bytes
	// 	if( event.file.size > 1024 ) {
	// 		event.preventDefault();
	// 	}
	// });
	document.addEventListener('trix-attachment-add', function( event ) {
		var attachment = event.attachment;
		if( attachment.file ) {
			return uploadAttachment(attachment);
		}
	});
	document.addEventListener('trix-attachment-remove', function( event ) {
		var attachment = event.attachment;
		if( attachment.file ) {
			var key = attachment.getAttribute('key');
			delete images[key];
		}
	});
	form.addEventListener('submit', function( event ) {
		var attachments = editor.getDocument().getAttachments();
		attachments.forEach(function( attachment ) {
			var input   = document.createElement('input');
			input.type  = 'hidden';
			input.name  = 'images[]';
			input.value = attachment.getAttribute('key');
			form.appendChild(input);
		});
	});

	function uploadAttachment( attachment ) {
		var file = attachment.file;
		var key  = createStorageKey(file);
		
		var form = new FormData;
		form.append('key', key);
		form.append('file', file);
		
		var xhr = new XMLHttpRequest;
		xhr.open('POST', host, true);
		xhr.upload.onprogress = function( event ) {
			var progress = event.loaded / event.total * 100;
			return attachment.setUploadProgress(progress);
		};
		xhr.onload = function() {
			if( xhr.status === 204 ) {
				images[key] = true;
				return attachment.setAttributes({
					url  : host+'/'+key,
					key  : key
				});
			}
		};
		return xhr.send(form);
	};

	function createStorageKey( file ) {
		var date = new Date();
		var time = date.getTime();
		return time + '-' + file.name;
	};

}