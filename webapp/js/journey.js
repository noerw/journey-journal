/**  
* @desc   defines the datastructure for journeys
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// the local copy of the journey that is loaded/viewed/edited
// value is filled in clientRouting.js#loadJourney() and journeyEdit.js#updateJourney()
var journey = {};

function Journey(name, description, sections) {
	this.name        = name        || 'journey title';
	this.description = description || 'journey description';
	this.sections    = sections    || [];
};

function Section(name, description, date, locations) {
	this.name        = name        || 'section title';
	this.description = description || 'enter a description..';
	this.date        = date        || '2015-08-23';
	this.locations   = locations   || [];
};

function Location(geojson, name, description, imgref) {
	var json        = geojson    || {};
	json.properties = {
		name:        name        || 'location name',
		description: description || 'location description',
		imgref:      imgref      || ''
	};
	return json;
};

/**
 * helper function to find the currently selected section in the sidebar
 * @param id optional id of the section
 * @return the selected section from the local journeys copy, if it was found, else undefined
 */
function findCurrSection(id) {
    // WARNING: window.location doesn't seem to be updated immediately after change
    //          better provide id!
    var sectionID = id || window.location.hash.slice(1);

    // find selected section
    for (var i = 0; i < journey.sections.length; i++) {
        if (journey.sections[i]._id === sectionID) {
            return journey.sections[i];
        }
    }
}


/**
 * @desc   
 * @param  location the location we search for
 * @param  section  optional section in which to search. if not given, the current section will be looked up
 * @return the index-position in section.locations
 */
function findLocation(location, section) {

	var sec = section || findCurrSection();

	// find corresponding location in section
	for (var i = 0; i < sec.locations.length; i++) {
	    // this roundtrip is necessary, as we need the same data-format for comparision
	    // (convert the coordinate data from string to int)
	    var convertedLoc = new L.geoJson(sec.locations[i]).toGeoJSON().features[0];

	    // check if equal
	    if (_.isEqual(location, convertedLoc)) return i;
	}
}