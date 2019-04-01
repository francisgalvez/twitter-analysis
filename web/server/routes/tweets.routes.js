const express = require('express');
const router = express.Router();
const geojson = require('geojson');

const Tweet = require('../models/tweet');

// http://tuproyecto.com/api/tweets/topics/:topiclist/condition/:operator/geolocation/:option
// http://tuproyecto.com/api/tweets/topics/topic1,topic2,topic3/condition/and/geolocation/false

// Get located/not located tweets
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

// Get ALL tweets
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

// Get ALL located tweets
router.get('/located', async (req, res) => {
    var tweets;

    tweets = await Tweet.find({ location : { $exists : true }}).lean();
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get located tweets from the last X hours
router.get('/located/since/:hours', async (req, res) => {
    var tweets;

    // Llamada a la BD correspondiente

    tweets = await Tweet.find({ location : { $exists : true }}).lean();
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Endpoint interno para borrar tweets más antiguos

module.exports = router;
