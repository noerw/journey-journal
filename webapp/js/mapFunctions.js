/**  
* @desc   provides dynamic functionality for the map
* @author Norwin Roosen, Stefanie Nagelsdiek
* @date   150601
*/

"use strict";

/*
 * Fades the map in and out
 */
var mapIsVisible = true;
function toggleMap() {

     var duration = 1000;
     
     if (mapIsVisible) {
          $('#map').fadeTo(duration, 0);
          mapIsVisible = false;
          JL('mapLogger').info("Map was faded out (" + duration + " ms)");
     } else {
          $('#map').fadeTo(duration, 1);
          mapIsVisible = true;
          JL('mapLogger').info("Map was faded in (" + duration + " ms)");
     }
};


/**
 * locates the user and shows his position on the map
 */
function geolocate() {
     map.locate({setView: true, maxZoom: 16});
};


/**
 * adds a layer from a GeoJSON file to the map
 * @param GeoJSON object
 * @param name of the layer as string
 */
function addGjsonLayer(GJSONobject, name) {        
     // define the gjson object as leaflet layer
     var parsedLayer = new L.geoJson(GJSONobject);
     
     // add layer to map & layerControl
     parsedLayer.addTo(map);
     layerControl.addOverlay(parsedLayer, name);

     JL("mapLogger").info("Layer was added to the map ("+ name + ")");
};

/**
 * adds a layer to a specific featuregroup
 * @param GeoJSON object
 * @param name of the layer as string
 * @param featuregroup to that the layer is added
 */
function addLayerToGroup(layer, name, featuregroup) {        
     // define the gjson object as leaflet layer
     
     // add layer to map & layerControl
     featuregroup.addLayer(layer)
     layerControl.addOverlay(layer, name);

     JL("mapLogger").info("Layer was added to the map ("+ name + ")");
};

/**
 * called when the users location was found
 * @param e location-event
 */map.on('locationfound', function onLocationFound(e) {
    var radius = e.accuracy / 2;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point.").openPopup();

    L.circle(e.latlng, radius).addTo(map);
    
    JL('mapLogger').info("Location was found (" + e.latlng + ")");
});

/**
 * to be called when the users location could not be found
 * @param e location-event
 */
map.on('locationerror', function onLocationError(e) {
     JL('mapLogger').error("Location couldn't be found (" + e.message + ")");
});
