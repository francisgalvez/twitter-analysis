const express = require('express');
const router = express.Router();
const geojson = require('geojson');

const schema = require('../models/tweet')
const mongoose = require('mongoose');
const databases = require('../databases.json');


var db = mongoose.createConnection(databases.mainDb.URI + databases.mainDb.database_name, { useNewUrlParser: true });
var Tweet = db.model('Tweet', mongoose.Schema(schema.TweetSchema), 'coll');

var db2h = mongoose.createConnection(databases.twoHoursDb.URI + databases.twoHoursDb.database_name, { useNewUrlParser: true });
var Tweet_2h = db2h.model('Tweet_2h', mongoose.Schema(schema.TweetSchema), 'coll');

var db4h = mongoose.createConnection(databases.fourHoursDb.URI + databases.fourHoursDb.database_name, { useNewUrlParser: true });
var Tweet_4h = db4h.model('Tweet_4h', mongoose.Schema(schema.TweetSchema), 'coll');

var db6h = mongoose.createConnection(databases.fourHoursDb.URI + databases.sixHoursDb.database_name, { useNewUrlParser: true });
var Tweet_6h = db6h.model('Tweet_6h', mongoose.Schema(schema.TweetSchema), 'coll');

// Get ALL tweets
router.get('/all', async (req, res) => {
    var tweets = await Tweet.find().lean();
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get ALL located tweets
router.get('/located', async (req, res) => {
    var tweets;

    tweets = await Tweet.find({ location : { $exists : true }}).lean();
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get tweets with options
router.get('/topics/:topiclist?/condition/:operator/geolocation/:option', async (req, res) => {
    var tweets;

    if(req.params.topiclist == undefined){
        tweets = await Tweet.find({ location : { $exists : req.params.option }}).lean();
    } else {
        var engines = req.params.topiclist.split(",");

        if(req.params.operator == "or"){
            tweets = await Tweet.find({ topics : { $in: engines }, location : { $exists : req.params.option }}).lean();
        } else {
            tweets = await Tweet.find({ topics : { $all: engines }, location : { $exists : req.params.option }}).lean();
        }
    }
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get ALL tweets with options
router.get('/topics/:topiclist?/condition/:operator/geolocation/all', async (req, res) => {
    var tweets;

    if(req.params.topiclist == undefined){
        tweets = await Tweet.find().lean();
    } else {
        var engines = req.params.topiclist.split(",");

        if(req.params.operator == "or"){
            tweets = await Tweet.find({ topics : { $in: engines } }).lean();
        } else {
            tweets = await Tweet.find({ topics : { $all: engines } }).lean();
        }
    }
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get located tweets from the last X hours
router.get('/located/since/:hours', async (req, res) => {
    var tweets;
    var hours = req.params.hours;

    if(hours == "2hours"){
        tweets = await Tweet_2h.find({ location : { $exists : true }}).lean();
    } else if (hours == "4hours"){
        tweets = await Tweet_4h.find({ location : { $exists : true }}).lean();
    } else if (hours == "6hours"){
        tweets = await Tweet_6h.find({ location : { $exists : true }}).lean();
    }
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

router.get('/databases', async (req, res) => { 
    res.jsonp(databases);
});

// Endpoint interno para borrar tweets más antiguos de la franja horaria correspondiente
router.post('/delete/db/:db', async (req, res) => {
    var db = req.params.db;
    var timestamp = Date.now();

    if(db == databases.twoHoursDb.database_name) {
        await Tweet_2h.deleteMany({ timestamp : { $lte: (timestamp - databases.twoHoursDb.time*60*1000).toString() }});
    	res.sendStatus(200);
    } else if (db == databases.fourHoursDb.database_name) {
        await Tweet_4h.deleteMany({ timestamp : { $lte: (timestamp - databases.fourHoursDb.time*60*1000).toString() }});
	    res.sendStatus(200);
    } else if (db == databases.sixHoursDb.database_name) {
        await Tweet_6h.deleteMany({ timestamp : { $lte: (timestamp - databases.sixHoursDb.time*60*1000).toString() }});
	    res.sendStatus(200);
    } else {
	    res.sendStatus(400);
    }
});

module.exports = router;
