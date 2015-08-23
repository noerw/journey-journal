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

// controls of the map
var sidebar      = L.control.sidebar('sidebar').addTo(map);
var layerControl = L.control.layers(baseMaps).addTo(map);
watercolorLayer.addTo(map);
L.control.scale().addTo(map);
var drawnItems   = new L.FeatureGroup();
var draw         = undefined;
L.drawLocal.draw.toolbar.buttons.polyline = 'Add a route to the current section';
L.drawLocal.draw.toolbar.buttons.marker   = 'Add a marker to the current section';
L.drawLocal.edit.toolbar.buttons.edit     = 'Edit locations';
L.drawLocal.edit.toolbar.buttons.remove   = 'Delete locations';