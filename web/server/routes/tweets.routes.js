const express = require('express');
const router = express.Router();
const geojson = require('geojson');

const tweetSchema = require('../models/tweet');
const databasesSchema = require('../models/databases');
const mongoose = require('mongoose');
var elasticsearch = require('elasticsearch');

var settings = mongoose.createConnection('mongodb://mongo:27017/settings', { useNewUrlParser: true });
var databases = settings.model('Databases', mongoose.Schema(databasesSchema.DatabasesSchema), 'databases');

var db;
var Tweets = {};
var dbs = databases.find().lean().exec(function (err, docs) {
    for (var database in docs){
        if(docs[database].engine == "elasticsearch"){
            Tweets[docs[database].name] = new elasticsearch.Client({host: docs[database].URI, log: 'trace'});
        } else if (docs[database].engine == "mongo"){
            db = mongoose.createConnection(docs[database].URI + docs[database].database_name, { useNewUrlParser: true });
            Tweets[docs[database].name] = db.model('Tweet', mongoose.Schema(tweetSchema.TweetSchema), docs[database].collection);
        }
    }
});

// Get ALL tweets
router.get('/all', async (req, res) => {
    var response = await Tweets["mainDbES"].search({
                                                    index: 'twitter',
                                                    type: 'tweet',
                                                    body: {
                                                    query: {
                                                        match_all: {}
                                                    },
                                                    size: req.query.size
                                                    }
                                            });

    var tweets = response.hits.hits.map(hit => hit._source);
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get located or not located tweets
router.get('/geolocation/:option', async (req, res) => {
    var response;

    if(req.params.option == "true"){
        response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        exists : { "field" : "location" }
                    },
                    size: req.query.size
                }
            });
    } else if (req.params.option == "false") {
        response = await Tweets["mainDbES"].search({
            index: 'twitter',
            type: 'tweet',
            body: {
                query: {
                    bool: {
                        must_not: {
                            exists: {"field": "location"}
                        }
                    }
                },
                size: req.query.size
            }
        });
    }

    var tweets = response.hits.hits.map(hit => hit._source);
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get tweets with options
router.get('/topics/:topiclist/condition/:operator/geolocation/:option?', async (req, res) => {
    var response;

    if(req.params.operator == "or"){
        if(req.params.option == "true"){
            response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        bool: {
                            must: [{
                                exists : { "field" : "location" }
                            }, 
                            {
                                match: { topics: req.params.topiclist }
                            }]
                        },
                        
                    },
                    size: req.query.size
                }
            });
        } else if(req.params.option == "false") {
            response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        bool: {
                            must_not: {
                                exists: {"field": "location"}
                            },
                            must: {
                                match: { topics: req.params.topiclist }
                            }
                        }
                    },
                    size: req.query.size
                }
            });
        } else {
            response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        match: { topics: req.params.topiclist }
                    },
                    size: req.query.size
                }
            });
        }

    } else if (req.params.operator == "and") {
        if(req.params.option == "true"){
            response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        bool: {
                            must: [{
                                exists: {"field": "location"}
                            },
                            {
                                terms_set: {
                                    topics: {
                                        terms: req.params.topiclist.toLowerCase().split(","),
                                        minimum_should_match_script: {
                                            source: "params.num_terms"
                                        }
                                    }
                                }
                            }]
                        }
                    },
                    size: req.query.size
                }
            });
        } else if(req.params.option == "false") {
            response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        bool: {
                            must: {
                                terms_set: {
                                    topics: {
                                        terms: req.params.topiclist.toLowerCase().split(","),
                                        minimum_should_match_script: {
                                            source: "params.num_terms"
                                        }
                                    }
                                }
                            },
                            must_not: { exists: {"field": "location"} }
                        }
                    },
                    size: req.query.size
                }
            });
        } else {
            response = await Tweets["mainDbES"].search({
                index: 'twitter',
                type: 'tweet',
                body: {
                    query: {
                        terms_set: {
                            topics: {
                                terms: req.params.topiclist.toLowerCase().split(","),
                                minimum_should_match_script: {
                                    source: "params.num_terms"
                                }
                            }
                        }
                    },
                    size: req.query.size
                }
            });
        }
    }

    var tweets = response.hits.hits.map(hit => hit._source);
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get located or not located tweets since X hours
router.get('/geolocation/:option/since/:hours', async (req, res) => {
    var tweets;
    var option = (req.params.option == 'true');
    
    tweets = await Tweets[req.params.hours].find({ location : { $exists : option }}).lean();
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

// Get tweets with options since X hours
router.get('/topics/:topiclist/condition/:operator/geolocation/:option/since/:hours', async (req, res) => {
    var tweets;
    var hours = req.params.hours;
    var option = (req.params.option == 'true');
    var engines = req.params.topiclist.split(",");

    if(req.params.operator == "or"){
        if (req.params.option == "all") {
            tweets = await Tweets[hours].find({ topics: { $in: engines }}).lean();
        } else {
            tweets = await Tweets[hours].find({ topics: { $in: engines }, location : { $exists : option }}).lean();
        }
    } else if (req.params.operator == "and") {
        if (req.params.option == "all") {
            tweets = await Tweets[hours].find({ topics: { $all: engines }}).lean();
        } else {
            tweets = await Tweets[hours].find({ topics: { $all: engines }, location : { $exists : option }}).lean();
        }
    }
 
    res.jsonp(geojson.parse(tweets, { Point: 'location' }));
});

router.get('/databases', async (req, res) => { 
    response = await databases.find().lean();
    res.jsonp(response);
});

// Endpoint interno para borrar tweets más antiguos de la franja horaria correspondiente
router.post('/delete/db/:db', async (req, res) => {
    var dbName = req.params.db;
    
    var names = await databases.findOne({name: dbName}).lean();
    var time = Date.now() - names.time*60*1000;
    console.log(time);

    var tweets = await Tweets[dbName].deleteMany({ timestamp : { $lte: time }});
    res.send(tweets);
});

module.exports = router;
