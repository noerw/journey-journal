/**  
* @desc   defines the datastructure for journeys
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/*
 * datastructure for the journey
 */
function Journey(name, sections) {
	this.name     = name     || 'journey title';
	this.sections = sections || [];

	this.toString = function() {
		return JSON.stringify(this, null, '  ');
	};
};

function Section(name, description, date, locations) {
	this.name        = name        || 'section title';
	this.date        = date        || '18/08/2015';
	this.description = description || 'enter a description..';
	this.locations   = locations   || [];
};

function Location(name, geojson, imgRef) {
	this.name    = name    || 'location name';
	this.geojson = geojson || {};
	this.imgRef  = imgRef  || '';
};