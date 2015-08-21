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

// open sidebar on the corresponding tab
// needed for the links in the overview tab
window.onhashchange = function(e) {
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
            console.log('journey (' + journey.name + ') was loaded');
            //console.log(JSON.stringify(journey, null, '  '));
            
            // make the loaded content visible
            loadJourneyContentsIntoSidebar();
            
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
        var panelContent = sbarPanel(section.name, section.description.replace(/\n/g, '<br>'), section.date);
        sidebar.addPanel(section._id, sbarTab(i + 1), panelContent);
    }
};