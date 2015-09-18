/**  
* @desc gets all stored journeys and lets the user select, import, or create a new one
*/

'use strict';

/**
 * loads the stored journeys and shows them in the table on startup
 */
 $(document).ready(function() {
    // get stored journeys from DB server
    ajax(function(err, result) {
        if (err) return console.error('couldn\'t load journeys from DB:', err);

        // add the loaded items to the table
        // each journeys id is stored in the table rows data-id attribute
        // add a button to each row & register loadJourney() there
        for (var i = 0; i < result.length; i++) {
            $('#journeysTblBody').append('<tr onclick="openJourney(this, \'overview\')" data-id="' 
                + result[i]._id + '"><td>'
                + result[i].name + '</td><tr>');
        }

        if (result.length > 0) $('#journeysList').removeClass('hidden');

    }, 'http://' + location.host + '/getAllJourneys');


    logToDB('startpage loaded');
});

/**
 * creates a new journey and loads it
 */
function newJourney() {
    // get name from textfield
    var name = $('#newJourneyTxt').val();
    if (!name) return bootbox.alert({ size: 'small', message: 'Please enter a name!' });

    bootbox.dialog({
        title: 'Journey description',
        message: 'Please enter a description to your journey:<br><br>'
               + '<textarea rows="8" cols="40" id="descTxtArea" class="form-control"></textarea>',
        buttons: {
            'Cancel': {},
            'OK': {
                className: "btn-success",
                callback: function() {
                    // push a new journey to the DB
                    ajax(function(err, result) {
                        if (err) return console.error('couldn\'t create new journey on DB:', err);
                        
                        logToDB('journey created: ' + result._id, function() {
                            // load the new route
                            openJourney(result._id, 'add-section');
                        });

                    }, 'http://' + window.location.host + '/updateJourney', 'POST',
                        {
                            name: name,
                            description: $('#descTxtArea').val(),
                            sections: []
                        }
                    );
                }
            }
        },
        onEscape: function() {}
    }); 
}

/**
 * opens a journey
 * @param param a string containing the journeys ID, or the corresponding table row DOM element
 * @param tab   string containing the id of the tab that will be loaded ('overview' or 'add-section')
 */
function openJourney(param, tab) {
    var url = 'http://' + window.location.host + '/journey?id=';
    
    if (typeof param === 'string') { // executed from 'newJourney()'
        url += param;
    }  else {                        // executed from tablerow click
        url += $(param).data('id');
    }
    url += '#' + tab;

    // go to map page
    window.location = url;
}

/**
 * imports a journey & images from a json file to the database
 * @param event the onchange event from the input field
 */
function importJourney(event) {
    var input  = event.target;
    var reader = new FileReader();
    reader.readAsText(input.files[0]);

    // extract journey & images from the file
    // and push them seperately to the server
    reader.onload = function(){
        var json = JSON.parse(reader.result);
        
        async.parallel([
            // add journey to db
            function(callback) {
                ajax(function(err, result) {
                    if (err) return callback(err, null);
                    callback(null, result);
                }, 'http://' + location.host + '/updateJourney', 'POST', json.journey);
            },

            // add images to db
            function(callback) {
                async.each(json.images, function(item, imageCallback) {

                    ajax(function(err, result) {
                        if (err) return imageCallback(err);
                        imageCallback(null);
                    }, 'http://' + location.host + '/addImage', 'POST', item);
                    
                }, function(err) {
                    if (err) return callback(err, null);
                    callback(null, null);
                });
            }
        // final callback, called when all ajax calls are complete
        ], function(err, results) {
            if (err) return console.error('error while importing journey: ' + err);
            logToDB('journey imported: ' + json.journey._id);
            openJourney(json.journey._id, 'overview');
        });
    };
}