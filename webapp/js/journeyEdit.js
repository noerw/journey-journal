/**  
* @desc   functions for editing the journey & saving changes to the database
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/*
 * HTML templates for new sections in the sidebar
 */
function sbarTab(number) {
    return '<i class="fa fa-angle-right"></i> ' + number;
};

function sbarPanel(name, description, date) {
    return '<h1>%NAME%</h1><p>%DATE%</p><br><p>%DESC%</p>'
    	.replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'))
        .replace('%DATE%', 'Date: ' + date.slice(0,10));
};


/**
 * @desc  adds a new section to the journey, and pushes the change to the DB server
 * @param form DOM element of the new-section-form
 */
function addSection(form) {
	var section = new Section(form.inputTitle.value, form.inputDesc.value, form.inputDate.value);
	// add section to data
	journey.sections.push(section);
	form.reset();

	// push changes to server DB
	updateJourney(function() {
		// add section to sidebar (content, tab, overview), after the server responded
		var panelID = journey.sections[journey.sections.length - 1]._id;

		sidebar.addPanel(
			panelID,
			sbarTab(journey.sections.length),
	 		sbarPanel(section.name, section.description, section.date)
	 	);

        $('#journey-sections').append('<li><p>' + section.name + '</p></li>');

	 	sidebar.open(panelID);
	 	window.location.hash = '#' + panelID; // needed, as plugin doesn't update the url :^(		
	});

	logToDB('section added');
	return false; // to supress the submit of the form
};


/**
 * @desc  pushes changes on the journey to the DB server and updates its local version
 * @param callback function that is executed, after the ajax call succeeded
 */
function updateJourney(callback) {
    $.ajax({
        type: 'POST',
        data: journey,
        url: 'http://' + window.location.host + '/updateJourney',
        timeout: 5000,
        success: function(data, textStatus ){
        	journey = data;
			console.log('journey updated to DB');

            // execute callback when ajax is finished
            if (typeof callback === 'function') callback();
        },
        error: function(xhr, textStatus, errorThrown){
			console.log('couldn\'t update journey on DB: ' + errorThrown);
        }
    });
};