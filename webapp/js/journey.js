/**  
* @desc   Data structure for the journeys
* @author Norwin Roosen
* @date   150822
*/

'use strict';

function Journey(name, sections) {
	this.name     = name     || 'journey title';
	this.sections = sections || [];

	this.toString = function() {
		return JSON.stringify(this, null, '  ');
	};
};

function Section(name, description, locations) {
	this.name        = name        || 'section title';
	this.description = description || 'enter a description..';
	this.locations   = locations   || [];
};

function Location(name, geojson, imgRef) {
	this.name    = name    || 'location name';
	this.geojson = geojson || {};
	this.imgRef  = imgRef  || '';
};