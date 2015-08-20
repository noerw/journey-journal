/**  
* @desc   creates a map in the HTML document using leaflet
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// create a new map, setting the view to Muenster
var map = L.map('map').setView([51.96, 7.624], 14);

// define basemaps
var osmLayer = new L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
var tonerLayer = new L.StamenTileLayer("toner");
var watercolorLayer = new L.StamenTileLayer("watercolor");
var baseMaps = {
     "Open Street Map": osmLayer,
     "Watercolor": watercolorLayer,
     "Toner": tonerLayer,
}

// controls of the map
var sidebar      = L.control.sidebar('sidebar').addTo(map);
var layerControl = L.control.layers(baseMaps).addTo(map);
L.control.scale().addTo(map);
var drawnItems   = new L.FeatureGroup();
var draw 		 = undefined;


// misc init
sidebar.open('overview');
watercolorLayer.addTo(map);

// events

/*
 * focus the map onto the geofeatures of a section, when a section is selected in the sidebar
 * & re-init the draw control
 */
sidebar.on('content', function(e) {
    // remove draw control & drawn items, if it exists
    if (draw !== undefined) {
    	map.removeLayer(drawnItems);
		drawnItems = new L.FeatureGroup();
    	draw.removeFrom(map);
    	draw = undefined;
    }

    // omit tabs, that arent sections (via negative list)
    var omitTabs = ['', 'overview', 'add-section'];
    if (omitTabs.indexOf(e.id) === -1) {

    	// find selected section by e.id
    	for (var i = 0; i < journey.sections.length; i++) {
    		if (journey.sections[i]._id === e.id) section = journey.sections[i];
    	}

        // add the sections layers to drawnItems
    	for (var i = 0; i < section.locations.length; i++) {
	        L.geoJson(section.locations[i].geojson, {
                onEachFeature: function (feature, layer) { 
                    // add popups
                    layer.bindPopup('A popup!');
                    drawnItems.addLayer(layer); 
                }
            });
    	}

        // init the draw control with the sections locations
		drawnItems.addTo(map)
		draw = new L.Control.Draw({
			edit: {	featureGroup: drawnItems },
			draw: {
				polygon:   false,
				circle:    false,
				rectangle: false
			}
		}).addTo(map);

        // focus the map on the bounding box of all features in the section
        map.fitBounds(drawnItems.getBounds());
    }
});

/**
 * save a drawn layer to the current section of the journey, when it was created
 * @param e draw event
 */
map.on('draw:created', function(e) {
	// add the drawn layer to the map
	var layer = e.layer;
    layer.bindPopup('A popup!');
	drawnItems.addLayer(layer);

	// open popup, asking for name and description, (adding an image?)
	bootbox.dialog({
        title: 'Add location',
        message: 'Please enter a name and description to this location:'
               + '<br><br><textarea rows="8" cols="40" id="descTxtArea" class="form-control"></textarea>',
        buttons: {
            'Cancel': {},
            'OK': {
                className: "btn-success",
                callback: function() {
                	// add it as geojson to the journeys current section
					var location = new Location(layer.toGeoJSON());
					section.locations.push(location);

					// push changes to the DB server
					updateJourney();
                }
            }
        },
        onEscape: function() {}
    });
});

/**
 * called when a drawn layer was deleted
 * removes the layer from the layercontrol
 * @param e draw event
 */
map.on('draw:deleted', function (e) {
     var layers = e.layers;
     layers.eachLayer(function(layer) {

     });
});