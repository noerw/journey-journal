/**  
* @desc   functions for editing the journey & saving changes to the database
* @author Norwin Roosen
* @date   150822
*/

'use strict';

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
            sbarPanel(section.name, section.description, section.date)
        );

        $('#journey-sections').append('<li><a href="#' + panelID + '">' + section.name + '</a></li>');

        // update the adress hash ( and open the correct sidebar tab)
        sidebar.open(panelID);
        window.location.hash = '#' + panelID;
        logToDB('section added: ' + panelID);
    });

    return false; // to supress the submit of the form
};

/**
 * @desc  adds a new location to the current section, and pushes the change to the DB server
 * @param geojson geojson of the new location
 * @param imgID id of the image that should be shown in the popup
 */
function addLocation(geojson, imgID) {
    // add the drawn layer as geojson to the journeys current section
    var location = new Location(geojson, $('#locInputTitle').val(), $('#locInputDesc').val(), imgID);
    findCurrSection().locations.push(location);
    
    // create popup, then add the layer to the map & update the DB
    locationPopup(location.properties.name, location.properties.description, 
        location.properties.imgID, function(popupHtml) {
            var layer = new L.geoJson(location);
            layer.bindPopup(popupHtml);
            drawnItems.addLayer(layer);

            // push changes to the DB server
            updateJourney();
            logToDB('location added');
        });
}

/**
 * save a drawn layer to the current section of the journey, when it was created
 * @param e draw event
 */
map.on('draw:created', function(e) {
    // open popup, asking for name and description, adding an image
    bootbox.dialog(newLocationPopup(function() {

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
    }));
});

/**
 * update location in the database, when it was modified in the map
 */
map.on('draw:edited', function(e) {
    // as there isn't any id given to the layer it's not possible
    // to select the correct one in journey.sections.locations
    // instead we replace all features, as we upload the whole journey anyway

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
        // for each removed layer: find its index in the locations array,
        var locationIndex = findLocation(layer.toGeoJSON(), section);
        
        // and remove it from the local journey
        section.locations.splice(locationIndex, 1);
    });

    // push changes to db
    updateJourney();
    logToDB('location deleted');
});


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
};    


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
};

/**
 * @desc downloads the journey (in a new tab/window)
 */
function downloadJourney() {
    window.open('http://' + window.location.host + '/exportJourney?id=' + journey._id);
    logToDB('journey downloaded: ' + journey._id);
};