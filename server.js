/**
* @desc   http & database server for the webapp
* @author Norwin Roosen
* @date   150822
*/

'use strict';

/**
 * server configuration
 * logLevel: filter the action types, that should be logged to DB & and on console
 *           valid values: 'SERVER-REQ', 'CLIENT-ACTION'
 */
var config = {
    httpPort:  8080,
    mongoPort: 27017,
    dbName:    'myJourneyJournal',
    logLevel:  ['SERVER-REQ', 'CLIENT-ACTION'],
    flickr: {
        api_key:     'fad8fb42e90ba69fda91a88df6a84738',
        secret:      'b5daeed895156293',
        permissions: 'write'
    }
}

var express    = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var async      = require('async');
var exif       = require('piexifjs');
//var flickr      = require('flickr-oauth-and-upload');

var app = express();

// enable processing of the received post content, limiting request size to 5 MB
var urlEncodedParser = bodyParser.urlencoded({extended: true, limit: '5mb' }); 

//var flickr = Flickr(config.flickr.api_key, config.flickr.secret,
//                    config.flickr.access_token, config.flickr.access_token_secret);

/*var flickr;
Flickr.authenticate(config.flickr, function(error, api) {
    flickr = api;
});*/

/* database schema for journeys */
var locationSchema = mongoose.Schema({
    properties: {
        name:        String,
        description: String,
        imgID:       String
    },
    geometry: {},
    type:     String
});

var sectionSchema = mongoose.Schema({
    name:        String,
    description: String,
    date:        { type: Date, default: Date.now },
    locations:   [locationSchema]
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
app.use('/favicon.ico', express.static(__dirname + '/webapp/img/favicon.ico'));

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


// adds OR updates the journey which is received via POST to the DB
app.post('/updateJourney', urlEncodedParser, function(req, res) {
    var id = req.body._id || new mongoose.mongo.ObjectID();
    Journey.findByIdAndUpdate(
        id,
        { 
            name:        req.body.name,
            description: req.body.description,
            sections:    req.body.sections || [],
            updated:     new Date()
        },
        { upsert: true, new: true },
        function(err, journey) {
            if (err) return console.error(err);
            res.send(journey);
        }
    );
});


// returns the journey and its images with the given id in the query
// returned document structure: {journey: {}, images: [] }, journey without _id
app.get('/exportJourney*', function(req, res) {
    if(req.query.id) {
        // if an id is given in the URL query, execute the following async funtions in series
        async.waterfall( [

            // find the used imageIDs
            function(callback) {
                getImageIDs(req.query.id, function(err, imageIDs, journey) {
                    if (err) return callback(err, null);
                    callback(null, imageIDs, journey);
                });
            },

            // find the corresponding images
            function(imageIDs, journey, callback) {

                var images = [];
                async.each(imageIDs, function(imageID, imageCallback) {
                    Image.findById(imageID, function(err, image) {
                        if (err) return imageCallback(err);
                        images.push(image);
                        imageCallback(null);
                    });
                }, function(err) {
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
            res.send(JSON.stringify(exportJourney, null, 2));
        });
    } else {
        res.send('specify a journey ID as in /exportJourney?id=myID')
    }
});

app.get('/removeJourney*', function(req, res) {
    if(req.query.id) {
        // if an id is given in the URL query, execute the following async funtions in series
        async.waterfall( [

            // find the used imageIDs
            function(callback) {
                getImageIDs(req.query.id, function(err, imageIDs, journey) {
                    if (err) return callback(err, null);
                    callback(null, imageIDs);
                });
            },

            // find the corresponding images & remove each
            function(imageIDs, callback) {

                async.each(imageIDs, function(imageID, imageCallback) {
                    Image.findByIdAndRemove(imageID, function(err, image) {
                        if (err) return imageCallback(err);
                        imageCallback(null);
                    });
                }, function(err) {
                    if (err) callback(err);
                    callback(null);
                });
            },

            // remove the journey itself
            function(callback) {
                Journey.findByIdAndRemove(req.query.id, function(err, journey) {
                    if (err) return callback(err);
                    callback(null);
                });
            }

        // catch errors, or respond with an combined export object as file 
        ], function (err) {
            if (err) return console.error(err);
            res.send('journey was deleted from DB');
        });
    } else {
        res.send('specify a journey ID as in /exportJourney?id=myID')
    }
});


// adds an image to the image schema
// when lat/lon data is provided, add an geoTag
app.post('/addImage', urlEncodedParser, function (req,res) {
    
    // if an geoTag is given, add it to the images exif data
    var imageData;
    if (req.body.geoTag) imageData = addGeoTag(req.body.imgData, req.body.geoTag);
    else                 imageData = req.body.imgData;

    var id = req.body._id || new mongoose.mongo.ObjectID();
    Image.findByIdAndUpdate(
        id,
        { imgData: imageData },
        { upsert: true, new: true },
        function(err, image) {
            if (err) return console.error(err);
            res.send(image._id);
        }
    );
});

// returns the journey with the given id in the query
app.get('/getImage*', function(req, res) {
    if(req.query.id) {
        Image.findById(req.query.id, function (err, image) {
            if (err) return console.error(err);
            res.json(image);
        });
    } else {
        res.send('specify an image ID as in /getImage?id=myID')
    }
});

// uploads an image to the flickr account specified in config.flickr
// does not work, as i couldnt get any of the available fickr api libs to work.
app.post('/imageToFlickr', urlEncodedParser, function(req, res) {

    async.waterfall([
        // find image from req.body.imgID
        function(callback) {
            Image.findById(req.body.imgID, function(err, image) {
                if (err) return callback(err, null);
                // convert from base64 to bytes
                callback(null, image.imgData);
            });
        },
        // push it to the flickr server
        function(imgData, callback) {
             
            /*var args = {
                photo: new Buffer(imgData, 'base64'),
                flickrConsumerKey: config.flickr.api_key,
                flickrConsumerKeySecret: config.flickr.secret,
                oauthToken: config.flickr.access_token,
                oauthTokenSecret: config.flickr.access_token_secret,
                callback: callback,
                optionalArgs: {title: req.body.name}
            };

            flickr.uploadPhoto(args);*/

            callback('failed to push image to fickr. '
                + 'flickr-API just won\'t work.. i tried. hard. '
                + '4 libraries later i give up. '
                + 'don\'t even ask about geotags', null);
            
        }
    ], function(err, result) {
        if (err) {
            console.error('Could not upload photo to flickr: ' + err);
            res.writeHead(501, err, {'content-type' : 'text/plain'});
            return res.send();
        }
        res.send('image pushed to flickr. flickr photoID: ' + result);
    });
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


/**
 * @desc  writes an action to the analytics database
 * @param ip     the IP of the callee of the request
 * @param action a description of the action taken by the request
 * @param type   string that distinguishes actions on the client and requests to the server
 */
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


/**
 * @desc   gets all image IDs from a journey
 * @param  journeyID the id of the journey to search
 * @param  function that is executed when the job is done.
 *         e.g. function(err, imageIDs, journey), where imageIDs is an array
 */
function getImageIDs(journeyID, callback) {
    // find the journey
    Journey.findById(journeyID, function(err, journey) {
        if (err) return callback(err, null);

        // extract all imageIDs used
        var imageIDs = [];
        for (var i = 0; i < journey.sections.length; i++) {
            var section = journey.sections[i];
            for (var k = 0; k < section.locations.length; k++) {
                var imageID = section.locations[k].properties.imgID;
                if (imageID != '') imageIDs.push(imageID);
            }
        }

        callback(null, imageIDs, journey);
    });
}

/**
 * @desc   adds an EXIF geoTag to an image
 * @param  imgData JPEG image as base64 or binary string
 * @param  geoTag  Array of coordinates: [lon, lat]
 * @return the image in the same encoding, with added exif data
 */
function addGeoTag(imgData, geoTag) {

        // get exif data
        var exifObj = exif.load(imgData);

        // set geotag
        // convert data format (*1kk, truncate decimals, positive!)
        var lat = ~~(geoTag[1] * 1000000);
        var lon = ~~(geoTag[0] * 1000000);

        if (lat < 0) {
            lat *= -1;
            exifObj["GPS"][exif.GPSIFD.GPSLatitudeRef] = "S";
        } else {
            exifObj["GPS"][exif.GPSIFD.GPSLatitudeRef] = "N";
        }

        if (lon < 0) {
            lon *= -1;
            exifObj["GPS"][exif.GPSIFD.GPSLongitudeRef] = "W";
        } else {
            exifObj["GPS"][exif.GPSIFD.GPSLongitudeRef] = "E";
        }

        exifObj["GPS"][exif.GPSIFD.GPSLatitude]  = [lat, 1000000];
        exifObj["GPS"][exif.GPSIFD.GPSLongitude] = [lon, 1000000];

        // add new exif data to image
        return exif.insert(exif.dump(exifObj), imgData);
}