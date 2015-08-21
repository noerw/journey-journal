/**  
* @desc   creates a map in the HTML document using leaflet
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// create a new map, setting the view to Muenster
var map = L.map('map', {
    center: [51.96, 7.624],
    zoom: 14,
    minZoom: 2,
    maxZoom: 17
});

// define basemaps
var osmLayer = new L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
var watercolorLayer = new L.StamenTileLayer("watercolor");
var tonerLayer      = new L.StamenTileLayer("toner");
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
        draw.removeFrom(map);
		drawnItems = new L.FeatureGroup();
    	draw       = undefined;
    }

    // omit tabs, that arent sections (via negative list)
    var omitTabs = ['', 'overview', 'add-section'];
    if (omitTabs.indexOf(e.id) === -1) {

    	// find selected section
        var section = findCurrSection(e.id);

        // add the sections layers to drawnItems
    	for (var i = 0; i < section.locations.length; i++) {
            console.log(JSON.stringify(section.locations[i]));
            var locProp = section.locations[i].properties;

	        L.geoJson(section.locations[i], {
                onEachFeature: function (feature, layer) { 
                    // add popups
                    layer.bindPopup(locationPopup(locProp.name, locProp.description, locProp.imgref));
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
        if (section.locations.length > 0) map.fitBounds(drawnItems.getBounds());
    }
});

/**
 * save a drawn layer to the current section of the journey, when it was created
 * @param e draw event
 */
map.on('draw:created', function(e) {

	// open popup, asking for name and description, (adding an image?)
    bootbox.dialog(newLocationPopup(function() {
        
        // get the entered values from the textbox
        var name = $('#locInputTitle').val();
        var desc = $('#locInputDesc').val();

    	// add the drawn layer as geojson to the journeys current section
        var layer    = e.layer;
        var location = new Location(layer.toGeoJSON(), name, desc);
    	findCurrSection().locations.push(location);

        // add layer to map
        layer.bindPopup(locationPopup(name, desc));
        drawnItems.addLayer(layer);

    	// push changes to the DB server
    	updateJourney();
    }));
});

/**
 * update location in the database, when it was modified in the map
 */
map.on('draw:edited', function (e) {
    // as there isn't any id given to the layer it's not possible
    // to select the correct one in journey.sections.locations
    // instead we replace all features, as we upload the whole journey anyway

    var section = findCurrSection();
    var i = 0;
    drawnItems.eachLayer(function(layer) {
        // !! here we trust leaflet.draw to not change the order of the layers !!
        section.locations[i++] = layer.toGeoJSON();
    });

    // push changes to db
    updateJourney();
});

/**
 * remove location in the database, when it was removed from the map
 */
map.on('draw:deleted', function (e) {
    e.layers.eachLayer(function(layer) {
        // find corresponding location in section & remove it


    });
    // push changes to db
    //updateJourney();
});

/**
 * helper function to find the currently selected section in the sidebar
 * @param id optional id of the section
 * @return the selected section from the local journeys copy, if it was found, else undefined
 */
function findCurrSection(id) {
    // WARNING: window.location doesn't seem to be updated immediately after change.
    var secID = id || window.location.hash.slice(1);

    // find selected section
    for (var i = 0; i < journey.sections.length; i++) {
        if (journey.sections[i]._id === secID) {
            return journey.sections[i];
        }
    }
}