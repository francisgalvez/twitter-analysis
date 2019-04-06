const express = require('express');
const router = express.Router();
const geojson = require('geojson');

const schema = require('../models/tweet')
const mongoose = require('mongoose');
const databases = require('../database.json');


var db = mongoose.createConnection(databases.mainDb.URI, { useNewUrlParser: true });
var Tweet = db.model('Tweet', mongoose.Schema(schema.TweetSchema), 'coll');

var db2h = mongoose.createConnection(databases.twoHoursDb.URI, { useNewUrlParser: true });
var Tweet_2h = db2h.model('Tweet_2h', mongoose.Schema(schema.TweetSchema), 'coll');

var db4h = mongoose.createConnection(databases.fourHoursDb.URI, { useNewUrlParser: true });
var Tweet_4h = db4h.model('Tweet_4h', mongoose.Schema(schema.TweetSchema), 'coll');

var db6h = mongoose.createConnection(databases.fourHoursDb.URI, { useNewUrlParser: true });
var Tweet_6h = db6h.model('Tweet_6h', mongoose.Schema(schema.TweetSchema), 'coll');

// http://tuproyecto.com/api/tweets/topics/:topiclist/condition/:operator/geolocation/:option
// http://tuproyecto.com/api/tweets/topics/topic1,topic2,topic3/condition/and/geolocation/false

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

// Endpoint interno para borrar tweets más antiguos

module.exports = router;
