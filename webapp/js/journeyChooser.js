/**  
* @desc   gets all stored journeys and lets the user select or create a new one
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * loads the stored journeys and shows them in the table on startup
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
  	if (!name) return bootbox.alert({ size: 'small', message: 'Please enter a name!' });

    bootbox.dialog({
        title: 'Journey description',
        message: 'Please enter a description to your journey:'
               + '<br><br><textarea rows="8" cols="40" id="descTxtArea" class="form-control"></textarea>',
        buttons: {
            'Cancel': {},
            'OK': {
                className: "btn-success",
                callback: function() {
                    // ajax to push the journey to the DB
                    $.ajax({
                        type: 'POST',
                        data: new Journey(name, $('#descTxtArea').val()),
                        url: 'http://' + window.location.host + '/addJourney',
                        timeout: 5000,
                        success: function(data, textStatus ){
                            console.log('new journey was saved to DB');
                            // store analytic
                            logToDB('journey created: ' + data);
                            // load the new route
                            loadJourney(data);
                        },
                        error: function(xhr, textStatus, errorThrown){
                            console.log("couldn't create new journey on DB: " + errorThrown);
                        }
                    });
                }
            }
        },
        onEscape: function() {}
    }); 
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
        logToDB('journey loaded: ' + param);
    }  else {                        // executed from tablerow click
        var id = $(param).data('id'); 
        url += id
        url += '#overview';
        logToDB('journey loaded: ' + id);
  
    }

	// go to map page
    window.location = url;
};