# my journey journal

This is a webapp diary for holiday-trips with mapping functionality.
It was created in Sep 2015 as the final submission for a university course.
The application is stable and runs on node and mongoDB.

## functionality
* persistent storage of multiple journeys
    * import & export from/to file
* single page viewing & editing of a journey
* mapping geo-features on an interactive map
* storing images for each geo-feature
    * automatically geotagging them in EXIF data
    * pushing images to a flickr account
        * **doesn't work atm** (broken flickr-API?)  
* logging user-interactions to database


## dependencies
* mongoDB v2.4.9
* node    v0.10.25

## run
Before the first run, make shure you have nodeJS, npm and mongoDB installed on your machine.
Then install all npm dependencies by calling `sudo npm install` in the apps root directory.

To start the server enter `npm start`, and the server should listen on `localhost:8080/`.

## configure
You can configure the server by editing the `config` variable in `server.js#l14`.

* **loglevel**: determines which kind of interaction is logged in the console and to the database. You may select clientside interactions with `'CLIENT-ACTION'`, and/or server requests with `'SERVER-REQ'`
* **flickr**: API-key and account tokens for the flickr integration
* everything else in that object should be selfexplanatory

## license
This software is licensed under GNU-2.0.