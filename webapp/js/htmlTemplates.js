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
        +  '<button class="btn btn-default btn-sm" onclick="editSection()">'
        +  '<i class="fa fa-edit"></i></button>')
        .replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'))
        .replace('%DATE%', 'Date: ' + date.slice(0,10));
};

function locationPopup(name, description, imgID, callback) {
    var html = '<h4>%NAME%</h4><p>%DESC%</p>'
        .replace('%NAME%', name)
        .replace('%DESC%', description.replace(/\n/g, '<br>'));
    var html2 = '<button class="btn btn-default btn-sm" onclick="editLocation()">'
              + '<i class="fa fa-edit"></i></button>';
    
    // load image if an ID is given
    if (typeof imgID !== 'undefined' && imgID != '') {
        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: 'http://' + window.location.host + '/getImage?id=' + imgID,
            timeout: 5000,
            success: function(content, textStatus){
                html += '<img src="' + content.imgData + '" alt="' + name + '_image"/><br><br>';
                html2 = '<button class="btn btn-primary btn-sm" onclick="uploadToFlickr(\'' 
                      + imgID + '\', \'' + name + '\')">'
                      + '<i class="fa fa-cloud-upload"></i> upload image to flickr</button> '
                      + html2;

                // execute callback and pass it the generated html
                if (typeof callback === 'function') callback(html + html2);
            },
            error: function(xhr, textStatus, errorThrown){
                console.log('image couldn\'t be loaded from DB: ' + errorThrown);
            }
        });
    } else {
        if (typeof callback === 'function') callback(html + html2);
    }
};

/**
 * @desc   opens a dialog, asking for info to create a new location
 * @param  okCallback function that is executed when the ok button was clicked.
 */
function newLocationDialog(okCallback) {
    bootboxDialog('Add location',
                  '<div class="form-group">'
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
                + '    <input type="file" accept="image/*" onchange="addImage(event)"></span>'
                + '</div></div><br>',
                  okCallback
    );
}

/**
 * @desc   opens a dialog to edit some feature
           the entered information can be queried from the values of #editTitle and #editDesc
 * @param  name  type of feature (section, location, journey) that should be edited
 * @param  okCallback function that is executed when the ok button was clicked
 */
function editDialog(name, okCallback) {
    bootboxDialog('Edit ' + name + ' information',
                  '<div class="form-group">'
                + '  <label for="editTitle" class="col-sm-3 control-label">Title:</label>'
                + '  <div class="col-sm-9">'
                + '    <input type="text" class="form-control" id="editTitle" placeholder="new title">'
                + '</div></div><br><br>'
                + '<div class="form-group">'
                + '  <label for="editDesc" class="col-sm-3 control-label">Description:</label>'
                + '  <div class="col-sm-9">'
                + '    <textarea type="text" class="form-control" rows="6" id="editDesc" placeholder="new description"></textarea>'
                + '</div></div><br><br><br><br><br><br><br>',
                  okCallback
    );
}

/**
 * @desc wrapper for a bootbox dialog
 */
function bootboxDialog(title, message, okCallback) {
    bootbox.dialog({
        title: title,
        message: message,
        buttons: {
            'Cancel': {},
            'OK': {
                className: "btn-success",
                callback: okCallback
            }
        },
        onEscape: function() {}
    });
}