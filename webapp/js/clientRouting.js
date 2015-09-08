/**  
* @desc   provides routing on the clientside, allowing permalinks and stuff
* @author Norwin Roosen
* @date   150822
*/

'use strict';


// the local copy of the journey that is loaded/viewed/edited
// value is filled in clientRouting.js#loadJourney() and journeyEdit.js#updateJourney()
var journey = {};

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
    ajax(function(err, result) {
        if (err) return console.error('journey could not be loaded..', err);
        if (result) {
            // store in local (global) copy & show it on the site
            journey = result;
            loadJourneyContentsIntoSidebar();

            logToDB('journey loaded: ' + id);
            //console.log(JSON.stringify(journey, null, '  '));
        } else {
            console.error('no journey could be found!');
        }

        // open the sidebar tab that is specified in the url, as the plugin doesnt do that by itself
        sidebar.open(window.location.hash.slice(1));
    }, 'http://' + window.location.host + '/getJourney?id=' + id);
}

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
        addSection2Sidebar(journey.sections[i], i + 1);
    }
}


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
        async.each(section.locations, function(location, callback) {
            addLocation2Map(location, function() { callback (null); });
        }, function(err) {
            //focus the map onto all locations
            if (section.locations.length) map.fitBounds(drawnItems.getBounds());
        })

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

function addSection2Sidebar(section, index) {
    // add sidebar panel
    sidebar.addPanel(
        section._id,
        sbarTab(index),
        sbarPanel(section.name, section.description, section.date, section._id)
    );
    
    // add to overview
    $('#journey-sections').append('<li><a href="#' + section._id + '">' + section.name + '</a></li>');
    $('#journey-sections-title').removeClass('hidden');
}

function addLocation2Map(location, callback) {
    var locProp = location.properties;
    // create popup (incl getting the image from the server)
    locationPopup(
        locProp.name,  locProp.description,
        locProp.imgID, location._id,
        function(popupHtml) {
            // add the location with its popup to the map
            var layer = new L.geoJson(location);
            layer.bindPopup(popupHtml);
            drawnItems.addLayer(layer);

            if (typeof callback === 'function') callback();
        }
    );
}