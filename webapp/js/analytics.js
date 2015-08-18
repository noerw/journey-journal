/**  
* @desc   functionality to submit analytics / log to the database
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * @desc  pushes log-entries of user-interaction/analytics to the DB server
 * @param action string describing the action
 */
function logToDB(action) {
    $.ajax({
        type: 'POST',
        data: {action: action},
        url: 'http://' + window.location.host + '/addAnalytics',
        timeout: 5000,
        success: function(data, textStatus ){ },
        error: function(xhr, textStatus, errorThrown){
			console.log('couldn\'t store analytics to DB: ' + errorThrown);
        }
    });
}