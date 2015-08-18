/**  
* @desc   gets all stored journeys and lets the user select or create a new one
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * loads the stored journeys and shows them in the table once the pages is loaded
 */
 $(document).ready(function() {
    // ajax stored journeys
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: 'http://' + window.location.host + '/getAllJourneys',
      timeout: 5000,
      success: function(content, textStatus){
        // add the loaded items to the table
        // each journeys id is stored in the table rows journeyID attribute
        // add a button to each row & register loadJourney() there
        for (var i = 0; i < content.length; i++) {
            $('#journeysTblBody').append('<tr onclick="loadJourney(this)" data-id="' 
                + content[i]._id + '"><td>'
                + content[i].name + '</td></tr>');
        }

        if (content.length > 0) $('#journeysTbl').removeClass('hidden');
      },
      error: function(xhr, textStatus, errorThrown){
      	console.log("naaw: " + errorThrown);
      }
    });
});

/**
 * creates a new journey and loads it
 */
function newJourney() {
	// get name from textfield
	var name = $('#newJourneyTxt').val();
	if (!name) {
		alert('Please enter a name!');
		return;
	}

    // ajax to push the journey to the DB
    $.ajax({
        type: 'POST',
        data: new Journey(name),
        url: 'http://' + window.location.host + '/addJourney',
        timeout: 5000,
        success: function(data, textStatus ){
        	console.log('new route was saved');
        	// store analytic
        	logToDB('new journey');
        	// load the new route
        	loadJourney(data);
        },
        error: function(xhr, textStatus, errorThrown){
			console.log("naaaw... " + errorThrown);
        }
    });
	// once uploaded, load it in the map
};

/**
 * opens a journey
 * @param a string containing the journeys ID, or the corresponding table row DOM element
 */
function loadJourney(param) {
	var url = 'http://' + window.location.host + '/journey?id=';

  if (typeof param === 'string') { // executed from 'newJourney()'
      url += param; 
      url += '#add-section'; 
  }  else {                        // executed from tablerow click
      url += $(param).data('id'); 
      url += '#overview'; 
  }

	// go to map page
  window.location = url;
};