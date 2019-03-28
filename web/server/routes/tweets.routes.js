const express = require('express');
const router = express.Router();
const geojson = require('geojson');

const Tweet = require('../models/tweet');

/*
// Get all tweets (language optional)
router.get('/:language?', async (req, res) => {
    var language = req.params.language;
    console.log(req.params);
    var tweets;

    if (language != null) {
        tweets = await Tweet.find({ topics : { $all: [language] }}).lean();
    } else {
        tweets = await Tweet.find().lean();
    }
 
    res.json(geojson.parse(tweets, { Point: 'location' }));
});*/

// Get tweets
router.get('/', async (req, res) => {
    var located = req.query.located;
    var topic = req.query.topic;

    // If false, we only find occurrences of both words together. If true, we find both topics.
    var inclusive = req.query.inclusive;
    var tweets;

    if (located != undefined) {
        if(topic == undefined){
            tweets = await Tweet.find({ location : { $exists : located }}).lean();
        } else {
            if(!inclusive){
                tweets = await Tweet.find({ topics : { $in: topic }, location : { $exists : located }}).lean();
            } else {
                tweets = await Tweet.find({ topics : { $all: topic }, location : { $exists : located }}).lean();
            }
        }
    } else {
        if(topic == undefined){
            tweets = await Tweet.find().lean();
        } else {
            if(!inclusive){
                tweets = await Tweet.find({ topics : { $in: topic }}).lean();
            } else {
                tweets = await Tweet.find({ topics : { $all: topic }}).lean();
            }
        }
    }
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get located tweets
router.get('/located', async (req, res) => {
    var topic = req.query.topic;

    // If false, we only find occurrences of both words together. If true, we find both topics.
    var inclusive = req.query.inclusive;
    var tweets;

    if(topic == undefined){
        tweets = await Tweet.find({ location : { $exists : true }}).lean();
    } else {
        if(!inclusive){
            tweets = await Tweet.find({ topics : { $in: topic }, location : { $exists : true }}).lean();
        } else {
            tweets = await Tweet.find({ topics : { $all: topic }, location : { $exists : true }}).lean();
        }
    }
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get located tweets from the last two hours

// Get located tweets from the last four hours

// Get located tweets from the last eight hours

module.exports = router;