function initMap( el, options ) {
	options || (options = {});
	var defaults = {
		center           : {lat: 52.3732175, lng: 4.8495996},
		zoom             : 13,
		disableDefaultUI : true,
		styles: [{
			"featureType": "administrative",
			"elementType": "labels.text.fill",
			"stylers": [{
				"color": "#333333"
			}]
		}, {
			"featureType": "landscape.man_made",
			"elementType": "geometry.fill",
			"stylers": [{
				"color": "#ffffff"
			}]
		}, {
			"featureType": "poi",
			"elementType": "geometry.stroke",
			"stylers": [{
				"color": "#ec0000"
			}]
		}, {
			"featureType": "poi",
			"elementType": "labels.text.fill",
			"stylers": [{
				"color": "#ec0000"
			}]
		}, {
			"featureType": "poi.business",
			"elementType": "labels",
			"stylers": [{
				"visibility": "off"
			}]
		}, {
			"featureType": "poi.medical",
			"elementType": "labels",
			"stylers": [{
				"visibility": "off"
			}]
		}, {
			"featureType": "poi.park",
			"elementType": "geometry.fill",
			"stylers": [{
				"color": "#bed400"
			}]
		}, {
			"featureType": "poi.school",
			"elementType": "labels",
			"stylers": [{
				"visibility": "off"
			}]
		}, {
			"featureType": "poi.sports_complex",
			"elementType": "labels",
			"stylers": [{
				"visibility": "off"
			}]
		}, {
			"featureType": "road",
			"elementType": "geometry.fill",
			"stylers": [{
				"color": "#e0e0e0"
			}]
		}, {
			"featureType": "road",
			"elementType": "labels.text.fill",
			"stylers": [{
				"color": "#666666"
			}]
		}, {
			"featureType": "road.arterial",
			"elementType": "geometry.fill",
			"stylers": [{
				"color": "#e5e5e5"
			}]
		}, {
			"featureType": "road.highway",
			"elementType": "geometry.fill",
			"stylers": [{
				"color": "#e5e5e5"
			}]
		}, {
			"featureType": "road.highway",
			"elementType": "geometry.stroke",
			"stylers": [{
				"color": "#cccccc"
			}]
		}, {
			"featureType": "transit.line",
			"elementType": "geometry.stroke",
			"stylers": [{
				"color": "#fff400"
			}]
		}, {
			"featureType": "water",
			"elementType": "geometry.fill",
			"stylers": [{
				"color": "#009fe9"
			}, {
				"weight": 2
			}]
		}]
	};
	for( var key in options ) {
		if( options[key] != undefined ) {
			defaults[key] = options[key];
		}
	}
	return new google.maps.Map(el, defaults);
}
function initMarker( options ) {
	options.crossOnDrag = options.crossOnDrag || false;
	options.icon        = options.icon || {
		size   : new google.maps.Size(40, 44),
		anchor : new google.maps.Point(8, 43)
	};
	options.icon.url = options.icon.url || '/img/flag.svg';
	return new google.maps.Marker(options);
}

function LocationEditor( input ) {
	this.input = input;
	var location = this.getLocation();
	
	var div  = document.createElement('div');
	input.parentNode.appendChild(div);
	this.map = initMap(div, {
		center      : location,
		zoom        : location ? 14 : 13,
		zoomControl : true
	});
	this.map.addListener('click', this.onMapClick.bind(this));
	
	if( location ) {
		this.setMarker(location);
	}
}

LocationEditor.prototype.onMapClick = function( event ) {
	this.setMarker(event.latLng);
	this.storeLocation();
};
LocationEditor.prototype.onMarkerClick = function() {
	this.removeMarker();
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
	var value;
	if( this.marker ) {
		var latLng = this.marker.getPosition();
		var point  = {type: 'Point', coordinates: [latLng.lat(), latLng.lng()]};
		value = JSON.stringify(point)
	} else {
		value = null;
	}
	this.input.value = value;
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
};
LocationEditor.prototype.removeMarker = function() {
	this.marker.setMap(null);
	this.marker = null;
};

LocationEditor.prototype._createMarker = function( latLng ) {
	var marker = initMarker({
		position  : latLng,
		map       : this.map,
		draggable : true
	});
	marker.addListener('click', this.onMarkerClick.bind(this));
	marker.addListener('dragend', this.onMarkerDrag.bind(this));
	
	return marker;
};
LocationEditor.prototype._moveMarker = function( latLng ) {
	this.marker.setPosition(latLng);
};