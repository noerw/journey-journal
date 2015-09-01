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

function Location(geojson, name, description, imgID) {
    var json        = geojson    || {};
    json.properties = {
        name:        name        || 'location name',
        description: description || 'location description',
        imgID:       imgID       || ''
    };
    return json;
};