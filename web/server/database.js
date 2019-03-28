const mongoose = require('mongoose');

const URI = 'mongodb://localhost/twitter';

mongoose.connect(URI, { useCreateIndex: true, useNewUrlParser: true })
    .then(db => console.log('DB is connected'))
    .catch(err => console.error(err));

module.exports = mongoose;