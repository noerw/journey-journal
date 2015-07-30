/**  
* @desc   http & database server for the webapp
* @author Norwin Roosen
* @date   150822
*/

'use strict';

// change these values, if you need another port config
var config = {
    httpPort: 8080,
    mongoPort: 27017,
    dbName: 'myJourneyJournal_dev'
}

var express    = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');

var app = express();
app.use(bodyParser.urlencoded({extended: true})); // enable processing of the received post content

/* database schema for journeys */
var locationSchema = mongoose.Schema({
    name:     String,
    geojson:  {},
    imgRef:   String
});

var sectionSchema = mongoose.Schema({
    name:        String,
    description: String,
    locations:   [locationSchema]
});

var journeySchema = mongoose.Schema({
    name:     String,
    updated:  { type: Date, default: Date.now },
    sections: [sectionSchema]
});
var Journey = mongoose.model('Journey', journeySchema);

/* database schema for analytics */
var analyticsSchema = mongoose.Schema({
    ip:        String,
    action:    String,
    type:      { type: String, enum: ['SERVER-REQ', 'CLIENT-ACTION'] },
    timestamp: { type: Date, default: Date.now }
});
var Analytics = mongoose.model('Analytics', analyticsSchema);


/* init database connection */
mongoose.connect('mongodb://localhost:' + config.mongoPort + '/' + config.dbName);
var database = mongoose.connection;

database.on('error', console.error.bind(console, 'ABORTING. database connection error:'));

// once db connection is open, start http server
database.once('open', function (callback) {
    
    console.log('connection to database established on port ' + config.mongoPort);
    app.listen(config.httpPort, function(){
        console.log('http server now running on port ' + config.httpPort);
    });
});


/* http routing */
// serve static content
app.use('/img', express.static(__dirname + '/webapp/img'));
app.use('/js',  express.static(__dirname + '/webapp/js'));
app.use('/lib', express.static(__dirname + '/webapp/lib'));

// code which is executed on every (non static) request
app.use(function(req, res, next) {
    // log requests in console & analytics schema
    console.log(req.method + ' ' + req.url + ' was requested by ' + req.connection.remoteAddress);
    logToAnalytics(req.connection.remoteAddress, req.method + ' ' + req.url, 'SERVER-REQ');

    // allow CORS
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/',        function(req, res) { res.sendFile(__dirname + '/webapp/index.html'); });
app.get('/journey', function(req, res) { res.sendFile(__dirname + '/webapp/map.html'); });

// returns the journey with the given id in the query
app.get('/getJourney*', function(req, res) {
    if(req.query.id) {
    	Journey.findById(req.query.id, function (error, journey) {
            if (error) return console.error(error);
            res.send(journey);
    	});
    } else {
        res.send('specify a journey ID as in /getJourney?id=myID')
    }
});

// returns IDs and names of all stored journeys
app.get('/getJourneys', function(req, res) {
    Journey.find({}, '_id name', function(error, journeys) {
        if (error) return console.error(error);
        res.json(journeys);
    });
});

// takes a json document via POST, which will be added to the database
app.post('/addJourney', function(req, res) {
	console.log(JSON.stringify(req.body));

    var journey = new Journey({
        name: req.body.name,
        updated: new Date(),
    	sections: req.body.sections
    });
    journey.save(function(error){
        var message = error ? 'failed to save journey: ' + error 
                            : 'journey saved';
        console.log(message + ' from ' + req.connection.remoteAddress);
        res.send(journey._id); // return the id of the new document
    });
});

app.post('/addAnalytics', function(req, res) {
    res.send(logToAnalytics(req.connection.remoteAddress, req.body, 'CLIENT-ACTION'));
});

// returns the stored analytics
// query syntax: ?ip=val
app.get('/getAnalytics*', function(req, res) {
    var query = req.query.ip ? {ip: req.query.ip} : {};
    Analytics.find(query, function(error, analytics) {
        if (error) return console.error(error);
        res.json(analytics);
    });
});

function logToAnalytics(ip, action, type) {
    var analytic = new Analytics({
        ip:        ip,
        action:    action,
        type:      type,
        timestamp: new Date()
    });

    analytic.save(function(error){
        if(error) {
            console.log('failed to save analytic from ' + ip +': ' + error);
        }
    });

    return analytic._id; // return the id of the new document
}