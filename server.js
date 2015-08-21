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
    //geojson:     {},

});

var sectionSchema = mongoose.Schema({
    name:        String,
    description: String,
    date:        { type: Date, default: Date.now },
    locations:   [{}]
});

var journeySchema = mongoose.Schema({
    name:        String,
    description: String,
    sections:    [sectionSchema],
    updated:     { type: Date, default: Date.now }
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
        console.log('http server now listening on port ' + config.httpPort);
    });
});



/* http routing */
// serve static content
app.use('/img', express.static(__dirname + '/webapp/img'));
app.use('/js',  express.static(__dirname + '/webapp/js'));
app.use('/lib', express.static(__dirname + '/webapp/lib'));

// inserts an client side entry into Analytics
app.post('/addAnalytics', function(req, res) {
    res.send(logToAnalytics(req.connection.remoteAddress, req.body.action, 'CLIENT-ACTION'));
});


// code which is executed on every (non static) request
app.use(function(req, res, next) {
    // log requests in analytics schema
    logToAnalytics(req.connection.remoteAddress, req.method + ' ' + req.url, 'SERVER-REQ');

    // allow CORS
    //res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/',        function(req, res) { res.sendFile(__dirname + '/webapp/index.html'); });
app.get('/journey', function(req, res) { res.sendFile(__dirname + '/webapp/map.html'); });

// returns the journey with the given id in the query
app.get('/getJourney*', function(req, res) {
    if(req.query.id) {
    	Journey.findById(req.query.id, function (error, journey) {
            if (error) return console.error(error);
            res.json(journey);
    	});
    } else {
        res.send('specify a journey ID as in /getJourney?id=myID')
    }
});

// returns IDs and names of all stored journeys
app.get('/getAllJourneys', function(req, res) {
    Journey.find({}, '_id name').sort( {updated: -1} ).exec(function(error, journeys) {
        if (error) return console.error(error);
        res.json(journeys);
    });
});

// takes a json document via POST, which will be added to the database
app.post('/addJourney', function(req, res) {
    var journey = new Journey({
        name: req.body.name,
        description: req.body.description,
        updated: new Date(),
    	sections: req.body.sections
    });
    journey.save(function(error){
        if (error) return console.error(error);
        res.send(journey._id); // return the id of the new document
    });
});

// updates the journey which is received
app.post('/updateJourney', function(req, res) {
    Journey.findByIdAndUpdate(
        req.body._id, 
        { 
            name: req.body.name,
            description: req.body.description,
            sections: req.body.sections,
            updated: new Date()
        },
        { new: true },
        function(error, result) {
            if (error) return console.error(error);
            res.send(result);
        }
    );
});

// TODO
// returns the journey AND ITS PICTURES with the given id in the query
// modified document: _id removed, picture blobs added
app.get('/downloadJourney*', function(req, res) {
    if(req.query.id) {
        // find journey
        Journey.findById(req.query.id, '-_id', function (error, journey) {
            if (error) return console.error(error);
            
            // find all assigned images

                // combine objects & send to callee
                res.setHeader('Content-disposition', 'attachment; filename=' 
                    + journey.name.split(' ').join('_') + '.json');
                res.setHeader('Content-type', 'application/json');
                res.json(journey);
        });
    } else {
        res.send('specify a journey ID as in /getJourney?id=myID')
    }
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
        } else {
            console.log(analytic.timestamp + '  '
                        + analytic.ip + '\t'
                        + analytic.type + '\t'
                        + analytic.action);
        }
    });

    return analytic._id; // return the id of the new document
}