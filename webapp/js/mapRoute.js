/**  
* @desc   provides routing functionality for the map using routing-machine
* @author Norwin Roosen, Laura Meierkort
* @date   150710
*/

"use strict";

// initialise the routing control
var routeCtrl = L.Routing.control({
    waypoints: [ L.latLng(51.9609, 7.6043), L.latLng(51.9655, 7.6) ],
    routeWhileDragging: true,
    routeDragInterval: 200,
    waypointMode: 'snap', // to avoid a type error bug in routing machine 
    show: false
}).addTo(map);


/* permalink functionality */
// load waypoints for the route depending on the url query
var calledURL = window.location.toString();
var querypos  = calledURL.lastIndexOf('?routeID=');

// set default route when no valid query is given
if(querypos == -1) {
    JL('mapLogger').info('default route loaded');
} else {
    var idString = calledURL.slice(querypos + 9); // +9 for '?routeID='
    loadRoute(idString);
    JL('mapLogger').info('route (id: ' + idString + ') loaded');
}

/**
 * saves the currently shown route (actually just the waypoints) to the database
 */
function saveRouteToDB() {
    // TODO retrieve route from routing plugin
    var url = 'http://' + window.location.host + '/addRoute';

    // this hack is needed somehow,
    // as leaflet doesn't recognize the waypoints array as an object..?
    var content = JSON.parse(JSON.stringify(
        { waypoints : routeCtrl.getWaypoints() }
    ));

    // perform post ajax
    $.ajax({
        type: 'POST',
        data: content,
        url: url,
        timeout: 5000,
        success: function(data, textStatus ){
           JL('ajaxLogger').info("route was succesfully added to the database on " + url);
           prompt('Route successfully saved!\nPermalink: ', 'http://' + window.location.host + '/?routeID=' + data);
        },
        error: function(xhr, textStatus, errorThrown){
           JL('ajaxLogger').error('unable to save to database (' + errorThrown + ')');
        }
    });
}

/**
 * gets all stored routes from the DB and inserts them into a table
 * when a tablerow is clicked, the corresponding route will be shown
 */
function loadAllRoutesFromDB() {
    var url = 'http://' + window.location.host + '/getAllRoutes';
    // perform ajax on the url and add the loaded routes to the route table
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: url,
      timeout: 5000,
      success: function(content, textStatus ){
        JL('ajaxLogger').info('database content was retrieved from ' + url
                             + ' (' + content.length + ' items)');

        // remove existing items from the table
        $('#tableRouteDBContents').empty();

        // add the loaded items
        for (var i = 0; i < content.length; i++) {

            // insert each received layer into the html table
            // store the waypoints in each table row in the attribute 'waypoints'
            // register showRouteOnClick() to each rows onclick event
            $('#tableRouteDBContents').append("<tr waypoints='"
                + JSON.stringify(content[i].data.waypoints)
                + "'><td>"
                + (i+1) + '</td><td>' 
                + content[i].dateInserted + '</td><td>'
                + content[i]._id + '</td><td>'
                + '<button class="btn btn-default btn-xs" onclick="showRouteOnClick(this)">show</button>');
        }
        
        $('#tableRouteDB').removeClass('hidden');
      },
      error: function(xhr, textStatus, errorThrown){
        JL('ajaxLogger').error("unable to get database content (" + errorThrown + ")");
      }
    });
}

/**
 * gets a certain route with the given ID from the database
 * @param _id attribute of the route stored in the DB
 */
function loadRoute(id) {
    var url = 'http://' + window.location.host + '/getRoute?id=' + id;

    // perform ajax on the url and add the specified route to the map
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: url,
      timeout: 5000,
      success: function(content, textStatus ){
        JL('ajaxLogger').info('database content was retrieved from ' + url);
        
        routeCtrl.setWaypoints(content.data.waypoints);
      },
      error: function(xhr, textStatus, errorThrown){
        JL('ajaxLogger').error("unable to get database content (" + errorThrown + ")");
      }
    });
}

/**
 * shows the corresponding route of the table item on which the passed button was pressed
 * the buttons parent parent has an attribute 'waypoints', which contains the routes waypoints
 * @param button DOM element
 */
function showRouteOnClick(button) {
    routeCtrl.setWaypoints(JSON.parse(
        $(button).parent().parent().attr("waypoints")
    ));
    JL('mapLogger').info('route was loaded!');
}