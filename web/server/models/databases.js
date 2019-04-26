const mongoose = require('mongoose');
const { Schema } = mongoose;

const DatabasesSchema = new Schema({
    name: { type: String, required: true },
    URI: { type: String, required: true },
    database_name: { type: String, required: true },
    collectionn: { type: String, required: true },
    time: { type: Number, required: false },
});
