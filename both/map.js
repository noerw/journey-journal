"use strict";

// initalisation code for the map
// execute on client only when template is rendered
if (Meteor.isClient) {
    Template.map.rendered = function() {

        // create a new map, setting the view to Muenster
        var map = L.map('map').setView([51.96, 7.61], 10);

        // OpenStreetMap basemap
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
             attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // add drawing tool
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialise the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: {
                polyline: {
                    shapeOptions: { color: '#003fc5', weight: 5 }
                },
                polygon:   false,
                circle:    false,
                rectangle: false
            }
        });

        map.addControl(drawControl);

        /**
         * called when a layer is drawn
         * stores the drawn features as layer
         * @param e draw event
         */
        map.on('draw:created', function (e) {
            var layer = e.layer;
            var type  = e.layerType;
            var name  = "drawn item (" + type + ")";
             
            // add the layer to the layergroup 'drawnItems' and to the map
            drawnItems.addLayer(layer)

        });
    }
}
