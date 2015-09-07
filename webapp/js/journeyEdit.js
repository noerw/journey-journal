/**  
* @desc   functions for editing the journey & saving changes to the database
* @author Norwin Roosen
* @date   150822
*/

'use strict';

function editJourney() {
    editDialog('journey', journey.name, journey.description, function() {
        var newTitle = $('#editTitle').val() || journey.name;
        var newDesc  = $('#editDesc').val()  || journey.description;
        journey.name        = newTitle;
        journey.description = newDesc;

        // update sidebar overview panel
        $('#journey-title').html(newTitle);
        $('#journey-desc').html(newDesc.replace(/\n/g, '<br>'));

        updateJourney();
        logToDB('journey information edited: ' + journey._id);
    });
}


function editSection() {
    var section = findCurrSection();

    editDialog('section', section.name, section.description, function() {
        var newTitle = $('#editTitle').val() || section.name;
        var newDesc  = $('#editDesc').val()  || section.description;
        section.name        = newTitle;
        section.description = newDesc;

        // update sidebar panel
        $('#sec-title-' + section._id).html(newTitle);
        $('#sec-desc-'  + section._id).html(newDesc.replace(/\n/g, '<br>'));

        updateJourney();
        logToDB('section information edited: ' + section._id);
    });
}

function editLocation(popupElement) {
    // find location by ID, that stands in the popupHTML
    var section = findCurrSection();
    var id      = $(popupElement).data('id');
    console.log(id);

    // find location by id
    var locProp;
    for (var i = 0; i < section.locations.length; i++) {
        if (section.locations[i]._id == id) {
            locProp = section.locations[i].properties;
            break;
        }
    }

    // open dialog
    editDialog('location', locProp.name, locProp.description, function() {
        // replace values
        var newTitle = $('#editTitle').val() || locProp.name;
        var newDesc  = $('#editDesc').val()  || locProp.description;
        locProp.name        = newTitle;
        locProp.description = newDesc;

        //update popup
        $(popupElement).parent().children('.popup-title').html(newTitle);
        $(popupElement).parent().children('.popup-desc' ).html(newDesc.replace(/\n/g, '<br>'));

        updateJourney();
        logToDB('location information edited: ' + id);
    });
}


/**
 * @desc  adds a new section to the journey, and pushes the change to the DB server
 * @param form DOM element of the new-section-form
 */
function addSection(form) {
    var section = new Section(form.inputTitle.value, form.inputDesc.value, form.inputDate.value);
    // add section to data
    journey.sections.push(section);
    form.reset();

    // push changes to server DB
    updateJourney(function() {
        // add section to sidebar after the server added an ID
        section = journey.sections[journey.sections.length - 1];
        addSection2Sidebar(section, journey.sections.length);

        // update the adress hash, and open the correct sidebar tab
        sidebar.open(section._id);
        window.location.hash = '#' + section._id;
        logToDB('section added: ' + section._id);
    });

    return false; // to supress the submit of the form
}

/**
 * @desc  save a drawn layer to the current section of the journey, when it was created.
 *        rather complex, as we first need to upload the image & get its ID back, then
 *        add the location & get it's ID back, create the popup & then add it to the map.
 * @param e draw event
 */
map.on('draw:created', function(e) {
    // the json to be added to the journey
    var geojson = e.layer.toGeoJSON();

    async.waterfall([
        // open dialog & add entered values to the geojson
        function(callback) {
            newLocationDialog(function() {
                geojson.properties.name = $('#locInputTitle').val() || 'location title';
                geojson.properties.description = $('#locInputDesc').val() || 'location description';

                callback(null);
            })
        },

        // upload image, if one was chosen
        function(callback) {
            // check if an image was added
            if (lastImage.imgData !== '') {

                // upload the image to the DB server
                ajax(function(err, result) {

                    if (err) return callback(err, null);
                    logToDB('image added: ' + result);
                    callback(null, result);

                }, 'http://' + window.location.host + '/addImage', 'POST', lastImage);

                lastImage.imgData = ''; // clear lastImage data
            } else {
                callback(null, '');
            }
        },

        // create location with returned imgID, update journey
        function(imgID, callback) {
            geojson.properties.imgID = imgID;
            findCurrSection().locations.push(geojson);

            updateJourney(function() { callback(null); });
        },

        // create Popup width the new location ID & add the location to the map
        function(callback) {
            var locations = findCurrSection().locations;
            var location = locations[locations.length - 1];
            addLocation2Map(location, function() { callback(null, location._id); });
        }
    ],
    // done!
    function(err, result) {
        if (err) return console.error('The location couldn\'t be added:', err);
        logToDB('location added: ' + result);
    });
});

/**
 * update location in the database, when it was modified in the map
 */
map.on('draw:edited', function(e) {
    // simply replace all features of the current section
    // thats cheaper, because we need to iterate them just once and not n times
    // as we would if we'd find each location by id to replace it

    var section = findCurrSection();
    var i = 0;
    drawnItems.eachLayer(function(layer) {
        section.locations[i++] = layer.toGeoJSON();
    });

    // push changes to db
    updateJourney();
    logToDB('location edited');
});

/**
 * remove location in the database, when it was removed from the map
 */
map.on('draw:deleted', function(e) {
    var section = findCurrSection();
  
    e.layers.eachLayer(function(layer) {
        var jsonLayer = layer.toGeoJSON();

        // for each removed layer: find its index in the locations array,
        // and remove it from the local journey
        for (var i = 0; i < section.locations.length; i++) {
            if (section.locations[i]._id == jsonLayer._id) {
                section.locations.splice(i, 1);
                break;
            }
        }
    });

    // push changes to db
    updateJourney();
    logToDB('location deleted');
});

/**
 * @desc  pushes changes on the journey to the DB server and updates its local version
 * @param callback function that is executed, after the ajax call succeeded
 */
function updateJourney(callback) {
    ajax(function(err, result) {
        if (err) return console.error('couldn\'t update journey on DB:', err);

        journey = result;

        // execute callback when ajax is finished
        if (typeof callback === 'function') callback();

    }, 'http://' + window.location.host + '/updateJourney', 'POST', journey);
}


// global object, buffering the last uploaded image
var lastImage = { imgData: '' };

/**
 * loads an image from a file input (called on change of the file input)
 * @param event onchange event from the file input
 */
function addImage(event) {
    var reader = new FileReader();
    // read image
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = function(){
        lastImage.imgData = reader.result;
    };
}

function removeJourney() {
    ajax(function(err, result) {
        logToDB('journey deleted: ' + journey._id, function() {
            window.location = 'http://' + window.location.host;
        });
    }, 'http://' + window.location.host + '/removeJourney?id=' + journey._id);
}