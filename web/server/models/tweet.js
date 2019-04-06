const mongoose = require('mongoose');
const { Schema } = mongoose;

const TweetSchema = new Schema({
    id: { type: String, required: true },
    topics: { type: Array, required: true },
    text: { type: String, required: true },
    source: { type: String, required: true },
    user_name: { type: String, required: true },
    location: { type: String, required: false },
    sensitive: { type: String, required: false },
    lang: { type: String, required: false },
    timestamp: { type: String, required: true },
    date: { type: String, required: true }
});

TweetSchema.index({ topics: 1 });

//module.exports = mongoose.model('Tweet', TweetSchema, 'coll');
