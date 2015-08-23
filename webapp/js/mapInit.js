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
    maxZoom: 17,
    maxBounds: [[90, 180], [-90, -180]]
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
watercolorLayer.addTo(map);

// controls of the map
var sidebar      = L.control.sidebar('sidebar').addTo(map);
var layerControl = L.control.layers(baseMaps).addTo(map);
L.control.scale().addTo(map);
var drawnItems   = new L.FeatureGroup();
var draw         = undefined;
L.drawLocal.draw.toolbar.buttons.polyline = 'Add a route to the current section';
L.drawLocal.draw.toolbar.buttons.marker   = 'Add a marker to the current section';
L.drawLocal.edit.toolbar.buttons.edit     = 'Edit locations';
L.drawLocal.edit.toolbar.buttons.remove   = 'Delete locations';


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
                polyline: { shapeOptions: { color: 'blue' } },
				polygon:   false,
				circle:    false,
				rectangle: false
			}
		}).addTo(map);

        // focus the map on the bounding box of all features in the section
        if (section.locations.length > 0) map.fitBounds(drawnItems.getBounds());
    }

    // log action to DB server
    logToDB('panel selected: ' + e.id);
});

/**
 * save a drawn layer to the current section of the journey, when it was created
 * @param e draw event
 */
map.on('draw:created', function(e) {
	// open popup, asking for name and description, TODO:adding an image
    bootbox.dialog(newLocationPopup(function() {
        
        // get the entered values from the textbox
        var name = $('#locInputTitle').val();
        var desc = $('#locInputDesc').val();

    	// add the drawn layer as geojson to the journeys current section
        var location = new Location(e.layer.toGeoJSON(), name, desc);
    	findCurrSection().locations.push(location);
        
        // add layer to map
        var layer = new L.geoJson(location);
        layer.bindPopup(locationPopup(location.properties.name, location.properties.description));
        drawnItems.addLayer(layer);

    	// push changes to the DB server
    	updateJourney();
        logToDB('location created: ' + e.layerType);
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
        section.locations[i++] = layer.toGeoJSON();
    });

    // push changes to db
    updateJourney();
    logToDB('location edited');
});

/**
 * remove location in the database, when it was removed from the map
 */
map.on('draw:deleted', function (e) {
    var section = findCurrSection();
  
    e.layers.eachLayer(function(layer) {
        // for each removed layer: find its index in the locations array,
        var locationIndex = findLocation(layer.toGeoJSON(), section);
        
        // and remove it from the local journey
        section.locations.splice(locationIndex, 1);
    });

    // push changes to db
    updateJourney();
    logToDB('location deleted');
});