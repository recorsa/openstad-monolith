function LocationEditor( input ) {
	this.input = input;
	
	var div  = document.createElement('div');
	input.parentNode.appendChild(div);
	this.map = new google.maps.Map(div, {
		center         : {lat: 52.3732175, lng: 4.8495996},
		zoom           : 13,
		mapTypeControl : false,
		zoomControl    : true,
	});
	this.map.addListener('click', this.onMapClick.bind(this));
	
	var location = this.getLocation();
	if( location ) {
		this.map.setZoom(14);
		this.setMarker(location);
	}
}

LocationEditor.prototype.onMapClick = function( event ) {
	this.setMarker(event.latLng);
	this.storeLocation();
};
LocationEditor.prototype.onMarkerDrag = function( event ) {
	this.storeLocation();
};

LocationEditor.prototype.getLocation = function() {
	var point = JSON.parse(this.input.value || null);
	if( point ) {
		return {lat: point.coordinates[0], lng: point.coordinates[1]}
	} else {
		return null;
	}
};
LocationEditor.prototype.storeLocation = function() {
	var latLng = this.marker.getPosition();
	var point  = {type: 'Point', coordinates: [latLng.lat(), latLng.lng()]};
	this.input.value = JSON.stringify(point);
};

LocationEditor.prototype.setMarker = function( latLng ) {
	if( !this.marker ) {
		this.marker = this._createMarker(latLng);
	} else {
		this._moveMarker(latLng);
	}
	
	setTimeout(function() {
		this.map.panTo(latLng);
	}.bind(this), 350);
}

LocationEditor.prototype._createMarker = function( latLng ) {
	var marker = new google.maps.Marker({
		position  : latLng,
		map       : this.map,
		draggable : true
	});
	marker.addListener('dragend', this.onMarkerDrag.bind(this));
	
	return marker;
};
LocationEditor.prototype._moveMarker = function( latLng ) {
	this.marker.setPosition(latLng);
};