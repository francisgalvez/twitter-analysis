const express = require('express');
const morgan = require('morgan');
const path = require('path');

const { mongoose } = require('./databases');

const app = express();  // Servidor

/* ----- Settings ----- */
app.set('port', process.env.PORT || 3000);

/* ----- Middlewares ----- */
app.use(morgan('dev'));

// Cada vez que el servidor reciba/envie un dato, lo interpretara en formato JSON
app.use(express.json());

/* ----- Routes ----- */
app.use('/api/tweets', require('./routes/tweets.routes'));

/* ----- Static files ----- */
app.use(express.static(path.join(__dirname, '../client')));

/* ----- Starting server ----- */
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});
