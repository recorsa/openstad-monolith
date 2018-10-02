// ----------------------------------------------------------------------------------------------------
// OpenStadMap
// TODO: hij gebruikt nu status, dat moet een generiekere term worden
// TODO: hij kan er niet goed mee omgaan als je meerdere keren markers zet; die overschrijven elkaar
// ----------------------------------------------------------------------------------------------------

class OpenStadMapWidget extends HTMLElement {

	constructor() {

		super();

		let self = this;
		self.todo = {};
		
		var template = document.createElement('template');
		template.innerHTML = `{% include "./openstad-map.html" %}`;
		var shadowRoot = self.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));

	}

	connectedCallback () {

		let self = this;

		self.markerStyle = {{markerStyle | safe}} || {};
		self.polygonStyle = {{polygonStyle | safe}} || {};
		self.config = {{config | safe}} || {
			center           : {lat: 52.3710476, lng: 4.9005494},
			zoom             : 14,
			zoomControl      : true,
			disableDefaultUI : true,
		};

		// TODO: hij selecteert nu zelf eerst markers, dan polygon; dat zou in deze param kunnen
		self.autoZoomAndCenter = self.getAttribute('autoZoomAndCenter') == 'false' ? false : true;

		self.initGoogleMaps();

	}

	initGoogleMaps() {

		var self = this;

		let script = document.createElement('script');
		script.src = "https://maps.googleapis.com/maps/api/js?key=" + self.config.googleKey;
		script.onload = function() {
			let element = self.shadowRoot.querySelector('openstad-map');
			self.map = new google.maps.Map(element, self.config.defaults);

			self.ready = true;
			self.initMap()
		};
		self.shadowRoot.appendChild(script);

	}

	initEditorMode() {

		// TODO: komt uit de stemvvansite maar doet nog niets

		// is editor
		var editorInputElement = 0 // xxxx
		var editorMarker = 0;
		if (editorInputElement) {

			self.onMapClick = function( event ) {
				self.setMarker(event.latLng);
				self.storeLocation();
			};

			self.onMarkerClick = function() {
				self.removeMarker();
				self.storeLocation();
			};

			self.onMarkerDrag = function( event ) {
				self.storeLocation();
			};

			// TODO: why self translation? Maybe Sequelize fieldtype?
			self.getLocation = function() {
				var point = JSON.parse(self.editorInputElement.value || null);
				if( point ) {
					return {lat: point.coordinates[0], lng: point.coordinates[1]}
				} else {
					return null;
				}
			};

			// TODO: why self translation? Maybe Sequelize fieldtype?
			self.storeLocation = function() {
				var value;
				if( self.editorMarker && self.editorMarker.getMap() ) {
					var latLng = self.editorMarker.getPosition();
					var point  = {type: 'Point', coordinates: [latLng.lat(), latLng.lng()]};
					value = JSON.stringify(point)
				} else {
					value = null;
				}
				self.editorInputElement.value = value;
			};

			self.setMarker = function( latLng ) {
				if( !self.editorMarker.getMap() ) {
					self.editorMarker.setMap(self.map);
				}
				self._moveMarker(latLng);
				setTimeout(function() {
					self.map.panTo(latLng);
				}.bind(self), 350);
			};

			self.removeMarker = function() {
				self.editorMarker.setMap(null);
			};

			self._moveMarker = function( latLng ) {
				self.editorMarker.setPosition(latLng);
			};

			self.editorInputElement = editorInputElement;
			self.editorMarker = editorMarker;
			self.editorMarker.position = self.getLocation();

		}

	}

	initMap() {

		var self = this;

		let polygon = self.config.polygon;
		if (self.getAttribute('polygon')) {
			try {
				polygon = JSON.parse(self.getAttribute('polygon'));
			} catch (err) {}
		}
		if (polygon) {
			self.createCutoutPolygon(polygon);
		}

		let markers;
		if (self.getAttribute('markers')) {
			try {
				self.markers = JSON.parse(self.getAttribute('markers'));
			} catch (err) {}
			self.createMarkers(markers);
		}

		// editor?
		if (self.editorInputElement) {
			if (self.editorMarker) {
				self.editorMarker = self.createMarker( self.editorMarker )
				self.editorMarker.addListener('click', self.onMarkerClick.bind(self));
				self.editorMarker.addListener('dragend', self.onMarkerDrag.bind(self));
			}
			self.map.addListener('click', self.onMapClick.bind(self));
		}

		// set bounds and center
		self.setBoundsAndCenter();

		if (self.todo.polygon) {
			self.createCutoutPolygon(self.todo.polygon);
			self.todo.polygon = undefined;
		}
		if (self.todo.markers) {
			self.createMarkers(self.todo.markers);
			self.todo.markers = undefined;
		}

	}

	createCutoutPolygon(polygon) {

		let self = this;
		self.polygon = polygon;
		if (!polygon) return;

		if (!self.ready) {
			self.todo.polygon = polygon;
			return;
		}
		
		polygon = self.polygon.slice();

		// polygon must defined from the south west corner to work with the outer box
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < polygon.length; i++) {
			bounds.extend(polygon[i]);
		}
		var center = bounds.getCenter();

		var smallest = 0; var index = 0;
		polygon.forEach(( point, i ) => {
			var y = Math.sin(point.lng-center.lng()) * Math.cos(point.lat);
			var x = Math.cos(center.lat())*Math.sin(point.lat) - Math.sin(center.lat())*Math.cos(point.lat)*Math.cos(point.lng-center.lng());
			var bearing = Math.atan2(y, x) * 180 / Math.PI;
			if (45 - bearing < smallest) {
				smallest = 45 - bearing;
				index = i;
			}
		});

		let a = polygon.slice(0, index - 1);
		let b = polygon.slice(index, polygon.length - 1);
		polygon = b.concat(a);
		
		// outer box
		// TODO: should be calculated dynamically from the center point
		var delta1 = 0.01;
		var delta2 = 5;
		var outerBox = [
			{lat: -90 + delta2, lng:  -180 + delta1 },
			{lat: -90 + delta2, lng:     0          },
			{lat: -90 + delta2, lng:   180 - delta1 },
			{lat:   0,          lng:   180 - delta1 },
			{lat:  90 - delta2, lng:   180 - delta1 },
			{lat:  90 - delta2, lng:     0          },
			{lat:  90 - delta2, lng:  -180 + delta1 },
			{lat:  90 - delta2, lng:  -180 + delta1 },
			{lat:   0,          lng:  -180 + delta1 },
		];
		
		// polygon style
		this.map.data.setStyle( Object.assign({
		}, self.polygonStyle ));
		
		this.map.data.add({
			geometry: new google.maps.Data.Polygon( [outerBox, polygon] )
		})

		self.setBoundsAndCenter();

	}

	createMarkers( markers ) {

		let self = this;

		console.log('==', markers);
		if (!self.ready) {
			self.todo.markers = markers;
			return;
		}

		if (markers && !Array.isArray(markers)) markers = [markers];

		self = this;
		self.markers = markers;

		markers.forEach(marker => {
			self.createMarker( marker )
		})

		self.setBoundsAndCenter();

	}

	createMarker( marker ) {

		let self = this;

		if (self.config && self.config.icons && self.config.icons[marker.status]) {
			marker.icon = Object.assign({}, self.config.icons[marker.status]);
		}

		if (marker.icon && marker.icon.size) {
			marker.icon.size = new google.maps.Size(...marker.icon.size);
		}
		if (marker.icon && marker.icon.anchor) {
			marker.icon.anchor = new google.maps.Point(...marker.icon.anchor);
		}
		if (marker.href) {
			marker.icon.clickable = true;
		}

		console.log(marker);

		var options = {
			position    : marker.position && marker.position.coordinates ? { lat: marker.position.coordinates[0], lng: marker.position.coordinates[1] } : marker.position,
			map         : self.map,
			icon        : marker.icon,
			crossOnDrag : self.markerStyle.crossOnDrag || false,
		}
		
		var googleMarker = new google.maps.Marker(options);

		var href = self.getAttribute('icon-href');
		if (href) {
			href = href.replace('[[id]]', marker.id);
			googleMarker.addListener('click', function() {
				window.location.href = href;
			});
		}

		return googleMarker;

	}

	setBoundsAndCenter() {

		let self = this;

		if (!self.autoZoomAndCenter) return;

		var points = self.markers && self.markers.length ? self.markers : self.polygon;
		if (self.editorMarker) {
			if (self.editorMarker.position) {
				points = [self.editorMarker];
			} else {
				points = self.polygon;
			}
		}

		if (!points) return;

		if (self.map.minZoom) {
			google.maps.event.addListenerOnce(self.map, 'bounds_changed', function() {
				if( self.map.getZoom() > self.map.maxZoom - 1 ) {
					self.map.setZoom( self.map.maxZoom - 1 );
				}
				if( self.map.getZoom() < self.map.minZoom + 1 ) {
					self.map.setZoom( self.map.minZoom + 1 );
				}
			});
		}

		var bounds = new google.maps.LatLngBounds();

		points.forEach(point => {
			if (!point.position && !(point.lat)) return;
			if (point.position) {
				point = point.position.coordinates ? { lat: point.position.coordinates[0], lng: point.position.coordinates[1] }  : point.position;
			}
			bounds.extend(point);
		})
		self.map.fitBounds(bounds);

	}

	fetch() {

		let self = this;

		if (!self.getAttribute('fetch-markers-url')) return;

		// TODO: fetch is too modern, so change or polyfill
		// TODO: CORS
		let url = self.getAttribute('fetch-markers-url');
		url = url + '&access_token=VRIth7Tv1j1tEyQ7Z8TnhSaqnmDXFenXoYCxrjxKMO9QwZYgLEiRfM1IU48zfMCxJEcNBm88HIzznomBhYgC3IRVFs9XguP3vi40';
		
		fetch(url, {
			method: 'get',
			headers: {
				"Accept": "application/json"
			},
		})
			.then(function (response) {
				return response.status == 200 ? response.json() : [];
			})
			.then(function (json) {

				// console.log('Map request succeeded with JSON response', json);

				// todo: element kan naar de functie zelf
				// de rest trouwens ook

				self.createMarkers(json);

				if (self.getAttribute('afterFetchCallback')) {
					eval(`${self.getAttribute('afterFetchCallback')}(self)`);
				}

			})
			.catch(function (error) {
				console.log('openstad-map request failed', error);
			});
	}

	static get observedAttributes() {return ['fetch-markers-url', 'markers', 'polygon']; }

	attributeChangedCallback(name, oldValue, newValue) {

		let self = this;

		switch(name) {

		case 'fetch-markers-url':
			self.fetch();
			break;

		case 'polygon':
			let polygon;
			try {
				polygon = JSON.parse(self.getAttribute('polygon'));
			} catch (err) {}
			self.createCutoutPolygon(polygon);
			break;

		case 'markers':
			let markers;
			try {
				markers = JSON.parse(self.getAttribute('markers'));
			} catch (err) {}
			self.createMarkers(markers);
			break;

		}

		if (self.getAttribute('afterAttributeChangedCallback')) {
			eval(`${self.getAttribute('afterAttributeChangedCallback')}(self, name, oldValue, newValue)`);
		}


	}

}

customElements.define('openstad-map-widget', OpenStadMapWidget);
