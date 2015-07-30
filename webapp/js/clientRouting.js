/**  
* @desc   provides routing on the clientside, allowing permalinks and stuff
* @author Norwin Roosen
* @date   150822
*/

'use strict';

var journey = {};

// load the journey for the route depending on the url query
// and add its content to the sidebar & map
$(document).ready(function() {
	if (window.location.search == '') {
		console.error('no route loaded (no ID specified)');
		return;
	}

    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: 'http://' + window.location.host + '/getJourney?id=' + window.location.search.slice(4), // 4 for '?id='
      timeout: 5000,
      success: function(content, textStatus){
      	journey = content
      	console.log('journey (' + journey.name + ') was loaded');
      },
      error: function(xhr, textStatus, errorThrown){
      	console.error('journey could not be loaded..  ' + errorThrown);
      }
    });
});