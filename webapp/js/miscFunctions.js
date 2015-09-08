/**  
* @desc   misc (helper-) functions
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * @desc  wrapper for jQuery ajax calls
 * @param callback callback to execute after the request has returned
                   node style 2 parameters: callback(err, result)
 * @param url      url to send the request to
 * @param method   optional HTTP method, defaults to 'GET'
 * @param data     optional js-object that is send as data with a 'POST' call
 */
function ajax(callback, url, method, data) {
    var ajaxOptions = {
        type:    method || 'GET',
        url:     url,
        timeout: 5000,
        success: function(data, textStatus) { callback(null, data); },
        error:   function(xhr, textStatus, errorThrown) { callback(errorThrown, null); }
    };

    if      (method === 'POST') ajaxOptions.data     = data;
    else if (method === 'GET')  ajaxOptions.dataType = 'json';

    $.ajax(ajaxOptions);
}


/**
 * @desc  pushes log-entries of user-interaction/analytics to the DB server
 * @param action string describing the action performed
 */
function logToDB(action, callback) {
    ajax(function(err, result) {
        if (err) return console.error('couldn\'t store analytics to DB:', err);
        console.log(action);
        if (typeof callback === 'function') callback();
    },
    'http://' + window.location.host + '/addAnalytics', 'POST', { action: action });
}

/**
 * @desc  pushes an image that is stored in the DB to flickr
 *        to the account specified in the serverconfig
 *        DOES NOT WORK (on serverside, see server.js#l257)
 * @param imgID database ID of the image to submit
 * @param name  title of the image on flickr
 */
function uploadToFlickr(imgID, name) {
    ajax(function(err, result) {
        if (err) return console.error(err);
        logToDB('image (' + imgID + ') uploaded to flickr');
    },
    'http://' + window.location.host + '/imageToFlickr', 'POST',
    {
        imgID: imgID,
        name:  name
    });
}


/**
 * @desc downloads the journey (in a new tab/window)
 */
function downloadJourney() {
    window.open('http://' + window.location.host + '/exportJourney?id=' + journey._id);
    logToDB('journey downloaded: ' + journey._id);
}

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