/**  
* @desc   provides draw functionality to the map
* @author Norwin Roosen, Stefanie Nagelsdiek
* @date   150601
*/

"use strict";

// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialise the draw control and pass it the FeatureGroup of editable layers
// options for the drawControl
var drawControlOptions = {
          edit: {
               featureGroup: drawnItems
          },
          draw: {
               polyline: {
                    shapeOptions: {
                         color: '#c4002b',
                    }
               },
               polygon: {
                    showArea: true,
                    allowIntersection: false, // Restricts shapes to simple polygons
                    drawError: {
                         color: '#00000', 
                         message: 'only convex shapes allowed!'
                    },
                    shapeOptions: {
                         color: '#c4002b'
                    }
                    
               },
               circle: {
                    shapeOptions: {
                         color: '#c4002b'
                    }  
               },
               rectangle: {
                    shapeOptions: {
                         color: '#c4002b'
                    }
               }
          }
     };
var drawControl = new L.Control.Draw(drawControlOptions);

map.addControl(drawControl);


/**
 * called when a layer is drawn
 * stores the drawn features as layer and puts its GeoJSON into a textbox
 * @param e draw event
 */
map.on('draw:created', function (e) {
     var layer = e.layer;
     var type  = e.layerType;
     var name  = "drawn item (" + type + ")";
     
     // add the layer to the layergroup 'drawnItems' and to the map
     addLayerToGroup(layer, name, drawnItems);

     // insert the underlying geoJSON into the textarea
     var drawnLayerJson =  layer.toGeoJSON();
     $('#drawnItemJSONText').val(JSON.stringify(drawnLayerJson, null, '  '));
     
     // toggle visibility of the textarea
     $('#textareaBody').collapse();

});

/**
 * called when a drawn layer was deleted
 * removes the layer from the layercontrol
 * @param e draw event
 */
map.on('draw:deleted', function (e) {
     var layers = e.layers;
     layers.eachLayer(function(layer) {
          layerControl.removeLayer(layer);
     });
     JL("mapLogger").info("Layer was removed from the map");
});