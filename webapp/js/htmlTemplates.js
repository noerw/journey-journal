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
    return ('<h1>%NAME%</h1><p>%DATE%</p><br><p>%DESC%</p>'
    	+  '<button class="btn btn-default btn-sm" onclick="">'
    	+  '<i class="fa fa-edit"></i></button> '
    	+  '<button class="btn btn-default btn-sm" onclick="">'
    	+  '<i class="fa fa-trash-o"></i></button>')
    	.replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'))
        .replace('%DATE%', 'Date: ' + date.slice(0,10));
};

function locationPopup(name, description, imgID) {
	var html =  '<h4>%NAME%</h4><p>%DESC%</p>'
    	.replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'));
    
    if (typeof imgID !== 'undefined' && imgID != '') {
    	// TODO: load image
    	html += '<img id="' + imgID + '"alt="' + name + ' image"/><br>';
    }
    html += '<button class="btn btn-default btn-sm" onclick="">'
    	  + '<i class="fa fa-edit"></i></button> '
    	  + '<button class="btn btn-default btn-sm" onclick="">'
    	  + '<i class="fa fa-trash-o"></i></button>';

    return html;
};

/**
 * @param okCallback function that is executed when the ok button was clicked.
 * @return the options for a bootbox dialog
 */
function newLocationPopup(okCallback) {
	return {
        title: 'Add location',
        message: '<div class="form-group">'
               + '  <label for="locInputTitle" class="col-sm-3 control-label">Title:</label>'
               + '  <div class="col-sm-9">'
               + '    <input type="text" class="form-control" id="locInputTitle" placeholder="Title">'
               + '</div></div><br><br>'

               + '<div class="form-group">'
               + '  <label for="locInputDesc" class="col-sm-3 control-label">Description:</label>'
               + '  <div class="col-sm-9">'
               + '    <textarea type="text" class="form-control" rows="6" id="locInputDesc" placeholder="Description"></textarea>'
               + '</div></div><br><br><br><br><br><br><br>'

			   + '<div class="form-group">'
               + '  <label class="col-sm-3 control-label">Add Image:</label>'
               + '  <div class="col-sm-3">'
               + '    <span class="form-control btn btn-default btn-file"><i class="fa fa-file-image-o"></i> Browse'
	    	   + '    <input type="file" onchange="uploadImage(event)"></span>'
               + '</div></div><br>',
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