/**  
* @desc   gets all stored journeys and lets the user select, import, or create a new one
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * loads the stored journeys and shows them in the table on startup
 */
 $(document).ready(function() {
    // ajax stored journeys
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'http://' + window.location.host + '/getAllJourneys',
        timeout: 5000,
        success: function(content, textStatus){
            // add the loaded items to the table
            // each journeys id is stored in the table rows data-id attribute
            // add a button to each row & register loadJourney() there
            for (var i = 0; i < content.length; i++) {
                $('#journeysTblBody').append('<tr onclick="openJourney(this, \'overview\')" data-id="' 
                    + content[i]._id + '"><td>'
                    + content[i].name + '</td><tr>');
            }

            if (content.length > 0) $('#journeysList').removeClass('hidden');
        },
        error: function(xhr, textStatus, errorThrown){
            console.log("naaw: " + errorThrown);
        }
    });
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
                    // ajax to push the journey to the DB
                    $.ajax({
                        type: 'POST',
                        data: new Journey(name, $('#descTxtArea').val()),
                        url: 'http://' + window.location.host + '/updateJourney',
                        timeout: 5000,
                        success: function(data, textStatus ){
                            console.log('new journey was saved to DB');
                            // store analytic
                            logToDB('journey created: ' + data._id);
                            // load the new route
                            openJourney(data._id, 'add-section');
                        },
                        error: function(xhr, textStatus, errorThrown){
                            console.log("couldn't create new journey on DB: " + errorThrown);
                        }
                    });
                }
            }
        },
        onEscape: function() {}
    }); 
};

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
};

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
                $.ajax({
                    type: 'POST',
                    data: json.journey,
                    url: 'http://' + window.location.host + '/updateJourney',
                    timeout: 5000,
                    success: function(data, textStatus) {
                        callback(null, data);
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        callback(errorThrown, null);
                    }
                });
            },

            // add images to db
            function(callback) {
                async.each(json.images, function(item, imageCallback) {
                    $.ajax({
                        type: 'POST',
                        data: item,
                        url: 'http://' + window.location.host + '/addImage',
                        timeout: 5000,
                        success: function(data, textStatus) {
                            imageCallback(null);
                        },
                        error: function(xhr, textStatus, errorThrown){
                            imageCallback(errorThrown);
                        }
                    });
                }, function(err) {
                    if (err) return callback(err, null);
                    callback(null, null);
                });
            }
        // final callback, called when all ajax calls are complete
        ], function(err, results) {
            if (err) return console.error('error while importing journey: ' + err);
            logToDB('journey imported: ' + json.journey._id);
            console.log(results[0]._id);
            openJourney(json.journey._id, 'overview');
        });




    };
};