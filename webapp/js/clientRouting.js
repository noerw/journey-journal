/**  
* @desc   provides routing on the clientside, allowing permalinks and stuff
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// load a journey depending on the url query upon startup
// & add its content to the sidebar & map
$(document).ready(function() {
    // checks wether a journey ID is specified
    if (window.location.search == '') {
        console.error('no route loaded (no ID specified)');
        return;
    }

    // loads the journey & displays it
    loadJourney(window.location.search.slice(4)); // 4 for '?id='
});

// open sidebar on the corresponding tab, when URL hash changes
window.onhashchange = function(e) {
    // only react to the links in the overview tab
    if (e.oldURL.search('#overview') !== -1) sidebar.open(window.location.hash.slice(1));
};

/**
 * @desc  loads the specified journey from the DB server
 * @param id ID of the journey
 * @param callback function that is executed after the ajax call succeeded
 */
function loadJourney(id) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'http://' + window.location.host + '/getJourney?id=' + id,
        timeout: 5000,
        success: function(content, textStatus){
            journey = content;
            if (journey) {
                //console.log(JSON.stringify(journey, null, '  '));
                
                // make the loaded content visible
                loadJourneyContentsIntoSidebar();

                logToDB('journey loaded: ' + id);
            } else {
                console.error('no journey could be found!');
            }
            
            // open the sidebar tab that is specified in the url, as the plugin doesnt do that by itself
            sidebar.open(window.location.hash.slice(1));
        },
        error: function(xhr, textStatus, errorThrown){
            console.error('journey could not be loaded..  ' + errorThrown);
        }
    });
};

/**
 * @desc  displays the contents of the local journey on the site
 *        by adding its contents to the sidebar
 */
function loadJourneyContentsIntoSidebar() {
    // set title in overview
    $('#journey-title').html('Overview: ' + journey.name);
    $('#journey-desc').html(journey.description.replace(/\n/g, '<br>'));

    // add sections to the sidebar & overview
    for (var i = 0; i < journey.sections.length; i++) {
        var section = journey.sections[i];

        // add to overview
        $('#journey-sections').append('<li><a href="#' + section._id + '">' + section.name + '</a></li>');
        
        // add sidebar panel
        var panelContent = sbarPanel(section.name, section.description.replace(/\n/g, '<br>'),
                                     section.date, section._id);
        sidebar.addPanel(section._id, sbarTab(i + 1), panelContent);
    }
};


/*
 * load the features of a section into the map and focus them,
 * when a section is selected in the sidebar & re-init the draw control
 */
sidebar.on('content', function(e) {
    // remove draw control & drawn items, if it exists
    if (draw !== undefined) {
        map.removeLayer(drawnItems);
        draw.removeFrom(map);
        drawnItems = new L.FeatureGroup();
        draw       = undefined;
    }

    // omit tabs, that arent sections
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
                    locationPopup(locProp.name, locProp.description, locProp.imgID,  section.locations[i]._id,
                        function(popupHtml) {
                            layer.bindPopup(popupHtml);
                            drawnItems.addLayer(layer);

                            // focus the map onto the loaded features
                            // execute this only once after all the items have been added
                            if (drawnItems.getLayers().length === section.locations.length) {
                                map.fitBounds(drawnItems.getBounds());
                            }
                        }
                    );
                }
            });
        }
        
        // init the draw control with the sections locations
        drawnItems.addTo(map)
        draw = new L.Control.Draw({
            edit: { featureGroup: drawnItems },
            draw: {
                polyline:  { shapeOptions: { color: 'blue' } },
                polygon:   false,
                circle:    false,
                rectangle: false
            }
        }).addTo(map);
    }

    // log action to DB server
    logToDB('panel selected: ' + e.id);
});
