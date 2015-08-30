/**  
* @desc   http & database server for the webapp
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * server configuration
 * logLevel: filter the action types, that should be logged (to DB & and on console)
 *           valid values: 'SERVER-REQ', 'CLIENT-ACTION'
 */
var config = {
    httpPort:  8080,
    mongoPort: 27017,
    dbName:    'myJourneyJournal_dev',
    logLevel:  ['SERVER-REQ', 'CLIENT-ACTION']
}

var express    = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var async      = require('async');

var app = express();

// enable processing of the received post content, limiting request size to 5 MB
var urlEncodedParser = bodyParser.urlencoded({extended: true, limit: '5mb' }); 

/* database schema for journeys */
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

var imageSchema = mongoose.Schema({
    imgData:    String // image encoded as base64 string
});
var Image = mongoose.model('Images', imageSchema)


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
app.use('/css', express.static(__dirname + '/webapp/css'));
app.use('/js',  express.static(__dirname + '/webapp/js'));
app.use('/lib', express.static(__dirname + '/webapp/lib'));

// inserts an client side entry into Analytics
app.post('/addAnalytics', urlEncodedParser, function(req, res) {
    res.send(logToAnalytics(req.ip, req.body.action, 'CLIENT-ACTION'));
});


// code which is executed on every (non static) request
app.use(function(req, res, next) {
    // log requests in analytics schema
    logToAnalytics(req.ip, req.method + ' ' + req.url, 'SERVER-REQ');

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
    // return only _id & name, sort by the last modified date
    Journey.find({}, '_id name').sort( {updated: -1} ).exec(function(error, journeys) {
        if (error) return console.error(error);
        res.json(journeys);
    });
});

// takes a json document (in journey schema) via POST, which will be added to the database
app.post('/addJourney', urlEncodedParser, function(req, res) {
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
app.post('/updateJourney', urlEncodedParser, function(req, res) {
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


// returns the journey and its images with the given id in the query
// returned document structure: {journey: {}, images: [] }, journey without _id
app.get('/exportJourney*', function(req, res) {
    if(req.query.id) {
        // if an id is given in the URL query, execute the following async funtions in series
        async.waterfall( [
            // find the journey
            function(callback) {
                Journey.findById(req.query.id, '-_id', function(err, journey) {
                    if (err) return callback(err, null);
                    callback(null, journey);
                });
            },

            // extract all imageIDs used & find the corresponding images
            function(journey, callback) {
            
                var imageIDs = [];
                for (var i = 0; i < journey.sections.length; i++) {
                    var section = journey.sections[i];
                    for (var k = 0; k < section.locations.length; k++) {
                        var imageID = section.locations[k].properties.imgID;
                        if (imageID != '') imageIDs.push(imageID);
                    }
                }

                var images = [];
                async.each(imageIDs, function(item, imageCallback) {
                    Image.findById(item, function(err, image) {
                        if (err) return imageCallback(err);
                        images.push(image);
                        imageCallback(null);
                    });
                }, function (err) {
                    if (err) callback(err);
                    callback(null, journey, images);
                });
            }

        // catch errors, or respond with an combined export object as file 
        ], function (err, journey, images) {
            if (err) return console.error(err);

            var exportJourney = { journey: journey, images: images };

            res.setHeader('Content-disposition', 'attachment; filename=journey_' 
                + exportJourney.journey.name.split(' ').join('_').substring(0, 26) + '.json');
            res.setHeader('Content-type', 'application/json');
            res.json(exportJourney);
        });
    }
});


// adds an image to the image schema
app.post('/addImage', urlEncodedParser, function (req,res) {
    var image = new Image({
        imgData: req.body.imgData
    });
    image.save(function(error){
        if (error) return console.error(error);
        res.send(image._id); // return the id of the new document
    });
});

// returns the journey with the given id in the query
app.get('/getImage*', function(req, res) {
    if(req.query.id) {
        Image.findById(req.query.id, function (error, image) {
            if (error) return console.error(error);
            res.json(image);
        });
    } else {
        res.send('specify an image ID as in /getImage?id=myID')
    }
});


// returns the stored analytics
// query syntax: ?ip=val
app.get('/getAnalytics*', function(req, res) {
    // if an ip is queried, filter by its value, else query all entries
    var query = req.query.ip ? {ip: req.query.ip} : {};

    Analytics.find(query, function(error, analytics) {
        if (error) return console.error(error);
        res.json(analytics);
    });
});


function logToAnalytics(ip, action, type) {
    // only log, when enabled in config.logLevel
    if (config.logLevel.indexOf(type) !== -1) {

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
                console.log(analytic.timestamp + '   '
                            + analytic.ip + '\t'
                            + analytic.type + '\t'
                            + analytic.action);
            }
        });

        return analytic._id; // return the id of the new document
    }

    return 'logging disabled for: ' + type;
}