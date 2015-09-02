/**  
* @desc   functions for editing the journey & saving changes to the database
* @author Norwin Roosen
* @date   150822
*/

'use strict';

function editJourney() {
    editDialog('journey', function() {
        var newTitle = $('#editTitle').val() || journey.name;
        var newDesc  = $('#editDesc').val()  || journey.description;
        journey.name        = newTitle;
        journey.description = newDesc;

        // update sidebar overview panel
        $('#journey-title').html(newTitle);
        $('#journey-desc').html(newDesc);

        updateJourney();
        logToDB('journey information edited: ' + journey._id);
    });
}


function editSection() {
    var section = findCurrSection();

    editDialog('section', function() {
        var newTitle = $('#editTitle').val() || section.name;
        var newDesc  = $('#editDesc').val()  || section.description;
        section.name        = newTitle;
        section.description = newDesc;

        // update sidebar panel
        $('#sec-title-' + section._id).html(newTitle);
        $('#sec-desc-'  + section._id).html(newDesc);

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
    var locationProp;
    for (var i = 0; i < section.locations.length; i++) {
        if (section.locations[i]._id == id) {
            locationProp = section.locations[i].properties;
            break;
        }
    }

    // open dialog
    editDialog('location', function() {
        // replace values
        var newTitle = $('#editTitle').val() || locationProp.name;
        var newDesc  = $('#editDesc').val()  || locationProp.description;
        locationProp.name        = newTitle;
        locationProp.description = newDesc;

        //update popup
        $(popupElement).parent().children('.popup-title').html(newTitle);
        $(popupElement).parent().children('.popup-desc' ).html(newDesc);

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
        // add section to sidebar (content, tab, overview), after the server responded
        var panelID = journey.sections[journey.sections.length - 1]._id;

        sidebar.addPanel(
            panelID,
            sbarTab(journey.sections.length),
            sbarPanel(section.name, section.description, section.date, panelID)
        );

        $('#journey-sections').append('<li><a href="#' + panelID + '">' + section.name + '</a></li>');

        // update the adress hash ( and open the correct sidebar tab)
        sidebar.open(panelID);
        window.location.hash = '#' + panelID;
        logToDB('section added: ' + panelID);
    });

    return false; // to supress the submit of the form
}

/**
 * @desc  adds a new location to the current section, and pushes the change to the DB server
 * @param geojson geojson of the new location
 * @param imgID id of the image that should be shown in the popup
 */
function addLocation(geojson, imgID) {
    // add the drawn layer as geojson to the journeys current section
    var location = new Location(geojson, $('#locInputTitle').val(), $('#locInputDesc').val(), imgID);
    findCurrSection().locations.push(location);
    
    // push changes to the DB server
    updateJourney(function() {
        //get the ID of the last location in array, which now has an _id from the DB
        var locations = findCurrSection().locations;
        var locID = locations[locations.length - 1]._id;

        // create popup, then add the layer to the map
        locationPopup(location.properties.name, location.properties.description, 
            location.properties.imgID, locID, function(popupHtml) {
                var layer = new L.geoJson(location);
                layer.bindPopup(popupHtml);
                drawnItems.addLayer(layer);
            }
        );
    });

    logToDB('location added');
}

/**
 * save a drawn layer to the current section of the journey, when it was created
 * @param e draw event
 */
map.on('draw:created', function(e) {
    // open popup, asking for name and description, adding an image
    newLocationDialog(function() {

        var layer = e.layer.toGeoJSON();

        // check if an image was added
        if (lastImage.imgData !== '') {

            // upload the image to the DB server
            $.ajax({
                type: 'POST',
                data: lastImage,
                url: 'http://' + window.location.host + '/addImage',
                timeout: 5000,
                success: function(data, textStatus) {
                    logToDB('image added: ' + data);
                    console.log('image uploaded: ' + data);

                    // add the drawn layer as geojson to the journeys current section
                    addLocation(layer, data);

                },
                error: function(xhr, textStatus, errorThrown){
                    console.log('couldn\'t upload image to DB: ' + errorThrown);
                }
            });

            lastImage.imgData = ''; // clear lastImage data
        } else {
            addLocation(layer, '');
        }
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
    $.ajax({
        type: 'POST',
        data: journey,
        url: 'http://' + window.location.host + '/updateJourney',
        timeout: 5000,
        success: function(data, textStatus) {
            journey = data;
            console.log('journey updated to DB');

            // execute callback when ajax is finished
            if (typeof callback === 'function') callback();
        },
        error: function(xhr, textStatus, errorThrown){
            console.log('couldn\'t update journey on DB: ' + errorThrown);
        }
    });
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