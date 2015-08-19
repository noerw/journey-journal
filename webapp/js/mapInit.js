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

// misc init
sidebar.open('overview');
watercolorLayer.addTo(map);