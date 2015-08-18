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
    loadJourney(window.location.search.slice(4), loadJourneyContentsIntoMap); // 4 for '?id='
});


/**
 * @desc  displays the contents of the local journey on the site
 *        by addin its contents to the sidebar & map
 */
function loadJourneyContentsIntoMap() {
    // set title in overview
    $('#journey-title').html('Overview: ' + journey.name);

    // add sections to the sidebar & overview
    for (var i = 0; i < journey.sections.length; i++) {
        var section = journey.sections[i];

        // add to overview
        $('#journey-sections').append('<li><p>' + section.name + '</p></li>');

        // add sidebar panel
        sidebar.addPanel(section.title, sbarTab(i + 1), sbarPanel(section.title, section.description));

        // add locations from sections to the map
        for (var k = 0; k < section.locations.length; k++) {

        }
    }

    // open the sidebar tab that is specified in the url, as the plugin doesnt do that by itself
    sidebar.open(window.location.hash.slice(1));
};