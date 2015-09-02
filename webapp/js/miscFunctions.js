/**  
* @desc   misc (helper-) functions
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * @desc  pushes log-entries of user-interaction/analytics to the DB server
 * @param action string describing the action performed
 */
function logToDB(action, callback) {
    $.ajax({
        type: 'POST',
        data: {action: action},
        url: 'http://' + window.location.host + '/addAnalytics',
        timeout: 5000,
        success: function(data, textStatus ){
            console.log(action);
            if (typeof callback === 'function') callback();
        },
        error: function(xhr, textStatus, errorThrown){
			console.log('couldn\'t store analytics to DB: ' + errorThrown);
        }
    });
}

/**
 * @desc  pushes an image that is stored in the DB to flickr 
 *        to the account specified in the serverconfig
 *        DOES NOT WORK (on serverside, see server.js#l251)
 * @param imgID database ID of the image to submit
 * @param name  title of the image on flickr
 */
function uploadToFlickr(imgID, name) {
    $.ajax({
        type: 'POST',
        data: {
            imgID: imgID,
            name:  name
        },
        url: 'http://' + window.location.host + '/imageToFlickr',
        timeout: 5000,
        success: function(data, textStatus) {
            logToDB('image (' + imgID + ') uploaded to flickr');
        },
        error: function(xhr, textStatus, errorThrown){
            console.error('couldn\'t upload image to flickr: ' + errorThrown);
        }
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