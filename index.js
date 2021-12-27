// Load credentials
const {credentials} = require('./lib/config/config');

// imports
const express = require('express');
const expressHandlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const redis = require('redis');
const expressSession = require('express-session');
const redisStore = require('connect-redis')(expressSession);
const redisClient = redis.createClient({legacyMode: true});
const helmet = require('helmet');

redisClient.on('error', (err) => console.log(`Redis client error: ${err.message}`));
redisClient.on('connect', () => console.log('Succesfully connected to the redis instance.'));

redisClient.connect()
    .catch((err) => console.log('Could not connect to redis...' + err));
redisClient.auth(credentials.redis.password)
    .catch((err) => console.log('Error authenticating into redis... ' + err));

const morgan = require('morgan');
const fs = require('fs');


//-------------------------------------
//          APP creation
//-------------------------------------
const app = express();

// Create and set the view engine
const hbs = expressHandlebars.create({
    defaultLayout: 'main',
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


//-------------------------------------
//           Security
//-------------------------------------
app.use(helmet.hidePoweredBy());
// TODO: Use helmet to generate security

//-------------------------------------
//          Middleware
//-------------------------------------
// Logging
switch(app.get('env')){
case 'development':
    app.use(morgan('dev'));
    break;
/* eslint-disable no-case-declarations */
case 'production':
    const stream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});
    app.use(morgan('combined', {stream}));
    break;
/* eslint-enable no-case-declarations */
}

//Cookies and sessions
app.use(cookieParser(credentials.cookieSecret));
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: new redisStore({
        client: redisClient,
        host: credentials.redis.host,
        port: credentials.redis.port,
    }),
}));

app.use(bodyParser.json());

app.use('/public', express.static(__dirname + '/public'));


//-------------------------------------
//          Normal routing
//-------------------------------------


//-------------------------------------
//          Special routing
//-------------------------------------
// 404 - not found
app.use((req, res) => res.render('404'));
// 500 - Internal server error
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
    console.log(err.message, err.stack);
    res.render('500');
});
/* eslint-enable no-unused-vars */


//-------------------------------------
//          Initialize the app
//-------------------------------------
/**
 * Generates a new server process
 * 
 * @param {number} port The port the process will listen to
 * @returns {void}
 */
function startServerInstance(port){
    app.listen(port, () => {
        `Express server in ${app.get('env')} mode, started on http://localhost:${port};
            Press Ctrl-C to terminate.`;
    });

    process.on('uncaughtException', (err) => {
        console.log(`FATAL ERROR: UNCAUGHT EXCEPTION
        ERRORMSG: ${err.message}
        stacktrace: ${err.stack}`);
    });
}

// Will invoke differently if the file is executed as a module or as the main file
if(require.main === module){
    startServerInstance(credentials.port);
} else {
    module.exports = startServerInstance;
}