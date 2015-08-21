/**  
* @desc   HTML templates for elements that are often reused
* @author Norwin Roosen
* @date   150822
*/

'use strict';

function sbarTab(number) {
    return '<i class="fa fa-angle-right"></i> ' + number;
};

function sbarPanel(name, description, date) {
    return '<h1>%NAME%</h1><p>%DATE%</p><br><p>%DESC%</p>'
    	.replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'))
        .replace('%DATE%', 'Date: ' + date.slice(0,10));
};

function locationPopup(name, description, imgref) {
	return '<h4>%NAME%</h4><p>%DESC%</p>'
    	.replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'));
};

/**
 * @param okCallback function that is executed when the ok button was clicked.
 * @return the options for a bootbox dialog
 */
function newLocationPopup(okCallback) {
	return {
        title: 'Add location',
        message: '<div class="form-group">'
               + '  <label for="locInputTitle" class="col-sm-2 control-label">Title:</label>'
               + '  <div class="col-sm-10">'
               + '    <input type="text" class="form-control" id="locInputTitle" placeholder="Title">'
               + '</div></div><br><br>'
               + '<div class="form-group">'
               + '  <label for="locInputDesc" class="col-sm-2 control-label">Description:</label>'
               + '  <div class="col-sm-10">'
               + '    <textarea type="text" class="form-control" rows="6" id="locInputDesc" placeholder="Description"></textarea>'
               + '</div></div><br><br><br><br><br><br><br>',
        buttons: {
            'Cancel': {},
            'OK': {
                className: "btn-success",
                callback: okCallback
            }
        },
        onEscape: function() {}
    };
}