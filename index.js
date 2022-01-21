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
const https = require('https');
const fs = require('fs');
const helmet = require('helmet');

const passport = require('passport');

const showFlashOnce = require('./lib/middleware/show-flash-once');
const sendUserHandlebars = require('./lib/middleware/send-user-handlebars');
const db = require('./lib/db/db');

//Configure passportjs
require('./lib/auth/passport')(passport, db);

//Configure and connect to redis
redisClient.on('error', (err) => console.log(`Redis client error: ${err.message}`));
redisClient.on('connect', () => console.log('Succesfully connected to the redis instance.'));

redisClient.connect()
    .catch((err) => console.log('Could not connect to redis...' + err));
redisClient.auth(credentials.redis.password);

const morgan = require('morgan');
const fs = require('fs');


//-------------------------------------
//          APP creation
//-------------------------------------
const app = express();

// Create and set the view engine
const hbs = expressHandlebars.create({
    defaultLayout: 'main',
    helpers: {
        ifeq: function(arg1, arg2, options) {
            if(arg1 === arg2) return options.fn(this);
            return options.inverse(this);
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

//-------------------------------------
//          RTSP - RELAY
//-------------------------------------
const {scriptUrl} = require('./lib/api/rtsp-relay')(app);

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
app.use(showFlashOnce);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Store user authentication into the session
app.use(passport.initialize());
app.use(passport.session());

app.use(sendUserHandlebars);

app.use('/public', express.static(__dirname + '/public'));


//-------------------------------------
//          Normal routing
//-------------------------------------
const mainRouter = require('./lib/routes/main-router')(scriptUrl);
app.use('/', mainRouter);

const authRouter = require('./lib/routes/auth-router')(passport);
app.use('/auth', authRouter);

const apiRouter = require('./lib/routes/api-router');
app.use('/api', apiRouter);

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
function StartServerInstance(port){

    https.createServer({
        key: fs.readFileSync('../sslcert/smartercity.es/privkey1.pem'),
        cert: fs.readFileSync('../sslcert/smartercity.es/cert1.pem'),
        ca: fs.readFileSync('../sslcert/smartercity.es/chain1.pem')
    }, app).listen(PORT, function(){
        console.log(`Express server in ${app.get('env')} mode, started on https://localhost:${port};
        Press Ctrl-C to terminate.`);
    });

    /*
    app.listen(port, () => {
        console.log(`Express server in ${app.get('env')} mode, started on http://localhost:${port};
            Press Ctrl-C to terminate.`);
    });
    */

    process.on('uncaughtException', (err) => {
        console.log(`FATAL ERROR: UNCAUGHT EXCEPTION
        ERRORMSG: ${err.message}
        stacktrace: ${err.stack}`);
    });
}

// Will invoke differently if the file is executed as a module or as the main file
if(require.main === module){
    StartServerInstance(credentials.port);

    db.CleanOldRecords()
        .then(() => console.log('Cleaned old records'))
        .catch((err) => console.log('ERROR: could not clean old records: ' + err));

    setInterval(() => {db.CleanOldRecords()
        .then(() => console.log('Cleaned old records'))
        .catch((err) => console.log('ERROR: could not clean old records: ' + err));
    }, 24*60*60*1000); //Clear old records every 24hrs
    
} else {
    module.exports = StartServerInstance;
}