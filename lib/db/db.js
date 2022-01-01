const {credentials} = require('../config/config');
const bcrypt = require('bcrypt');
const { DatabaseError } = require('pg/lib');
const knex = require('knex')({
    client: 'pg',
    connection: {
        user: credentials.db.user,
        host: credentials.db.host,
        database: credentials.db.database,
        password: credentials.db.password,
        port: credentials.db.port,
    },
    pool: {
        min: 2,
        max: 10,
    },
});
//-------------------------------------------
//                  Users
//-------------------------------------------
/**
 * Inserts a new user in the database with the propper password hashing
 * 
 * @param {string} username
 * @param {string} password - Non hashed password
 * @param {string} email
 * @param {boolean} [isAdmin=false]
 * @returns {Promise<Object>}
 * @throws {Error} - Throws a generic error when a user insertion cant be performed.
 */
function AddNewUserToDB(username, password, email, isAdmin = false){
    const hash = bcrypt.hashSync(password, credentials.bcryptConfig.saltRounds);
    return knex('users').insert({username: username, password: hash, email: email, isadmin: isAdmin})
        .then(() => {
            console.log(`New user ${username} created.`);
        });
}

/**
 * Returns all users in the database
 * 
 * @returns {Promise<Array<Object>>}
 */
function GetAllUsersFromDB(){
    return knex('users').select('*');
}

/**
 * Returns a user from the database.
 *
 * @param {Object} bundle The ID or the username must be specified, it will otherwise throw an error.
 * @param {number} [bundle.id]
 * @param {string} [bundle.username]
 * @returns {Promise<Object>} returns a promise that will resolve into a user.
 * @throws {TypeError} This error is thrown when the bundle object is not correctly passed.
 * @example //Returns the user with ID = 1
 * const user = await getOneUserFromDB({id: 1});
 * 
 */
function GetOneUserFromDB(bundle){
    if(bundle.id){
        return knex('users').select('*').where('id', bundle.id).then((result) => {return result[0];});
    }else if(bundle.username){
        return knex('users').select('*').where('username', bundle.username).then((result) => {return result[0];});
    }
    throw new TypeError('bundle object was not correctly built');
}

/**
 * Checks if user exists on the database
 *
 * @param {Object} bundle The ID or the username must be specified, it will otherwise throw an error.
 * @param {number} [bundle.id]
 * @param {string} [bundle.username]
 * @returns {Promise<boolean>} 
 * @throws {TypeError} This error is thrown when the bundle object is not correctly passed.
 * 
 */
async function UserExistsInDB(bundle) {
    let response = await GetOneUserFromDB(bundle);
    return !!response;
}

/**
 * Updates a user from the database
 *
 * @param {Object} bundle The ID or the username must be specified, it will otherwise throw an error.
 * @param {number} [bundle.id]
 * @param {string} [bundle.username]
 * @param {Object} params
 * @param {string} [params.username]
 * @param {string} [params.email]
 * @param {string} [params.password]
 * @throws {TypeError} This error is thrown when the bundle object is not correctly passed.
 * @returns {Promise<boolean>}
 * @throws {DatabaseError} This error is thrown when the user does not exist.
 * @example // Updates the user with id=1 to have username 'newUsername'
 * const user = await updateUserFromDB({id: 1}, {username: 'newUsername'});
 * 
 */
async function UpdateUserFromDB(bundle, params){
    const VALID_PROPERTIES = ['username', 'password', 'email'];
    const toUpdate = VALID_PROPERTIES.filter((value) => Object.keys(params).includes(value));
    //If the params object has none of the VALID_PROPERTIES defined, then send out an error
    if(!(toUpdate.length)){
        throw new TypeError('Params object is not correct');
    }
    // If the user does not exist throw error
    if(!(await UserExistsInDB(bundle))) throw new DatabaseError('User does not exist');
    //Build a new object that will be used to update the user properties
    let updater = {};
    for (const key of toUpdate) {
        if(params[key]) {
            if (key === 'password') {
                const hash = bcrypt.hashSync(params[key], credentials.bcryptConfig.saltRounds);
                updater[key] = hash;
            } else {
                updater[key] = params[key];
            }
        }
    }
    if(bundle.id){
        return knex('users').where('id', bundle.id).update(updater);
    }else if(bundle.username){
        return knex('users').where('username', bundle.username).update(updater);
    }
}

//-------------------------------------------
//                  Records
//-------------------------------------------
//TODO: Test all this
/**
 * Inserts a new user in the database with the propper password hashing
 * 
 * @param {Date} timestamp
 * @param {number} light - Non hashed password
 * @param {number} temperature
 * @param {number} ledLevel
 * @throws {Error} - Throws a generic error when a record insertion cant be performed.
 */
function AddRecordToDB(timestamp, light, temperature, ledLevel){
    knex('records').insert({timestamp: timestamp, light: light, temperature: temperature, ledlevel: ledLevel})
        .then(() => {
            console.log(`New Record ${timestamp} created.`);
        });
}

/**
 * Returns all available records
 * 
 * @returns {Promise<Array<Object>>}
 */
function GetAllRecordsFromDB(){
    return knex('records').select('*');
}

/** 
 * Returns the latest added record
 * 
 * @returns {Promise<Object>}
 */
function GetLatestRecordFromDB(){
    return knex('records').select('*').orderBy('timestamp', 'desc')
        .then((values) => {return values[0];});
}

/**
 * Removes records older than 14 days
 * 
 * @returns {Promise<void>}
 */
function CleanOldRecords(){
    const MAX_AGE = 14;
    return knex('records').where('timestamp' ,'<', (new Date(Date.now() - (MAX_AGE * 24*60*60*1000))).toISOString()).del();
}
//-------------------------------------------
//                Suggestions
//-------------------------------------------
/**
 * Adds a new suggestion to the database
 * 
 * @param {number} userId - User id used as foreign key
 * @param {string} suggestion
 * @param {number} rating
 * @returns {Promise<void>}
 */
function AddSuggestionToDB(userId, suggestion, rating) {
    return knex('suggestions').insert({userid: userId, suggestion: suggestion, rating: rating})
        .then(() => {
            console.log(`New Record from ${userId} created.`);
        });
}

/**
 * Returns all suggestions from the database
 * 
 * @returns {Promise<Array<Object>>}
 */
function GetAllSuggestionsFromDB() {
    return knex('suggestions').select('*');
}
/**
 * Returns a list with all user suggestions
 *
 * @param {number} id The ID of the user.
 * @returns {Promise<Array<Object>>}
 */
function GetAllUserSuggestionsFromDB(id){
    return knex('suggestions').select('*').where('userid', id).orderBy('id', 'desc').then((resp) => { 
        return resp.map((val, i) =>{
            console.log(val);
            return {
                id: i + 1,
                message: val.suggestion,
                rating: val.rating,
            };
        });
    });
}


module.exports = {
    //In case it is needed for specific querys
    queryBuilder: knex,
    AddNewUserToDB: AddNewUserToDB,
    GetAllUsersFromDB: GetAllUsersFromDB,
    GetOneUserFromDB: GetOneUserFromDB,
    UserExistsInDB: UserExistsInDB,
    UpdateUserFromDB: UpdateUserFromDB,

    AddRecordToDB: AddRecordToDB,
    GetAllRecordsFromDB: GetAllRecordsFromDB,
    GetLatestRecordFromDB: GetLatestRecordFromDB,
    CleanOldRecords: CleanOldRecords,

    AddSuggestionToDB: AddSuggestionToDB,
    GetAllSuggestionsFromDB: GetAllSuggestionsFromDB,
    GetAllUserSuggestionsFromDB: GetAllUserSuggestionsFromDB,
};

// Database input fakers they should only be used in development
/* eslint-disable no-unused-vars */
async function seedFakeRecords(numberToGen){
    const faker = require('faker');
    for (let i = 0; i < numberToGen; i++) {
        let timestamp = faker.date.recent(20, new Date());
        let light = faker.datatype.number(1024);
        let temperature = faker.datatype.number(1024);
        let ledLevel = faker.datatype.number(3);
        await knex('records').insert({
            timestamp:timestamp, light:light, temperature:temperature, ledlevel:ledLevel
        });
    }
}
/* eslint-enable no-unused-vars */