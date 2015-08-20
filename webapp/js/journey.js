/**  
* @desc   defines the datastructure for journeys
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// the local copy of the journey that is loaded/viewed/edited
// value is filled in clientRouting.js#loadJourney() and journeyEdit.js#updateJourney()
var journey = {};
// local copy of the currently selected section (copied from above journey)
// value is filled in mapInit.js#sidebar.on('content', ...)
var section = {};

function Journey(name, description, sections) {
	this.name        = name        || 'journey title';
	this.description = description || 'journey description';
	this.sections    = sections    || [];
};

function Section(name, description, date, locations) {
	this.name        = name        || 'section title';
	this.description = description || 'enter a description..';
	this.date        = date        || '18/08/2015';
	this.locations   = locations   || [];
};

function Location(geojson, name, description, imgRef) {
	this.geojson     = geojson     || {};
	this.name        = name        || 'location name';
	this.description = description || 'location description';
	this.imgRef      = imgRef      || '';
};