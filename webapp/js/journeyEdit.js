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
    var template = '<h1>%NAME%</h1><p>%DATE%</p><p>%DESC%</p>'
        .replace('%NAME%', name)
        .replace('%DESC%', description)
        .replace('%DATE%', date);
    return template;
};



function addSection(form) {

	console.log(form.inputDate.value);
	var section = new Section(form.inputTitle.value, form.inputDesc.value, form.inputDate.value);
	// add section to data
	journey.sections.push(section);
	form.reset();

	// push changes to server DB
	updateJourney();
	
	// add section to sidebar (content, tab, (overview?))
	// TODO: use id returned from db as id
	var panelID = section.name;
	sidebar.addPanel(panelID,
					 sbarTab(journey.sections.length),
				 	 sbarPanel(section.name, section.description, section.date)
 	);

 	sidebar.open(panelID);
 	window.location.hash = '#' + panelID; // needed, as plugin update the url :^(

	return false; // to supress the submit of the form
};


/**
 * @desc  pushes changes on the journey to the DB server and updates its local version
 */
function updateJourney() {
	// push changes to server

	// get new version from server (with added IDs from DB)
	// & replace local journey version

};

/**
 * @desc  loads the specified journey from the DB server
 * @param id ID of the journey
 * @param callback function that is executed after the ajax call succeeded
 */
function loadJourney(id, callback) {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'http://' + window.location.host + '/getJourney?id=' + id,
        timeout: 5000,
        success: function(content, textStatus){
            journey = content;
            console.log('journey (' + journey.name + ') was loaded');

            // execute callback when ajax is finished
            if (typeof callback === 'function') callback();
        },
        error: function(xhr, textStatus, errorThrown){
            console.error('journey could not be loaded..  ' + errorThrown);
        }
    });
};