const {credentials} = require('../config/config');

const {Client} = require('pg');

console.log('Creating DB:');

const dbClient = new Client({
    user: credentials.db.user,
    host: credentials.db.host,
    database: credentials.db.database,
    password: credentials.db.password,
    port: credentials.db.port,
});

const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            ID serial PRIMARY KEY,
            username VARCHAR ( 64 ) UNIQUE NOT NULL,
            password VARCHAR ( 256 ) NOT NULL,
            email VARCHAR ( 256 ) UNIQUE NOT NULL,
            isAdmin BOOLEAN NOT NULL DEFAULT FALSE
        );`;
const createRecordsTable = `
        CREATE TABLE IF NOT EXISTS records (
            id serial PRIMARY KEY,
            mote_id INT NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            light REAL,
            temperature REAL,
            ledLevel SMALLINT
        );
        CREATE INDEX IF NOT EXISTS mote_id ON records (mote_id);
        CREATE INDEX IF NOT EXISTS timestamp ON records (timestamp);`;
const createSuggestionsTable = `
        CREATE TABLE IF NOT EXISTS suggestions (
            ID serial PRIMARY KEY,
            userId INT NOT NULL,
            suggestion TEXT,
            rating SMALLINT,
            CONSTRAINT fk_user
                FOREIGN KEY(userId)
                    REFERENCES Users(ID)
        );`;

dbClient.connect().then(async () => {
    try{
        console.log('Creating tables if they don\'t exist...');
        await dbClient.query(createUsersTable);
        await dbClient.query(createRecordsTable);
        await dbClient.query(createSuggestionsTable);
    }catch(err) {
        console.log('ERROR: could not create database tables: ' + err);
    }finally {
        dbClient.end();
    }
});