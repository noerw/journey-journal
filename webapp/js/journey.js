/**  
* @desc   defines the datastructure for journeys
* @author Norwin Roosen
* @date   150822
*/

'use strict';

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

function Location(name, geojson, imgRef) {
	this.name        = name        || 'location name';
	this.description = description || 'location description';
	this.geojson     = geojson     || {};
	this.imgRef      = imgRef      || '';
};