/**  
* @desc   provides routing on the clientside, allowing permalinks and stuff
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// the local version of the journey that is loaded/viewed/edited
var journey = {};

// load a journey depending on the url query
// and add its content to the sidebar & map
$(document).ready(function() {
    // checks wether a journey ID is specified
    if (window.location.search == '') {
        console.error('no route loaded (no ID specified)');
        return;
    }

    // loads the journey & displays it
    loadJourney(window.location.search.slice(4)); // 4 for '?id='
});

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
            console.log('journey (' + journey.name + ') was loaded');
            console.log(JSON.stringify(journey));
            
            // make the loaded content visible
            loadJourneyContentsIntoMap();
        },
        error: function(xhr, textStatus, errorThrown){
            console.error('journey could not be loaded..  ' + errorThrown);
        }
    });
};

/**
 * @desc  displays the contents of the local journey on the site
 *        by addin its contents to the sidebar & map
 */
function loadJourneyContentsIntoMap() {
    // set title in overview
    $('#journey-title').html('Overview: ' + journey.name);
    $('#journey-desc').html(journey.description);

    // add sections to the sidebar & overview
    for (var i = 0; i < journey.sections.length; i++) {
        var section = journey.sections[i];

        // add to overview
        $('#journey-sections').append('<li><p>' + section.name + '</p></li>');
        // add sidebar panel
        var panelContent = sbarPanel(section.name, section.description, section.date);
        sidebar.addPanel(section._id, sbarTab(i + 1), panelContent);
        
        // add locations from sections to the map
        for (var k = 0; k < section.locations.length; k++) {

        }
    }

    // open the sidebar tab that is specified in the url, as the plugin doesnt do that by itself
    sidebar.open(window.location.hash.slice(1));
};