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
 * @throws {Error} - Throws a generic error when a user insertion cant be performed.
 */
function addNewUserToDB(username, password, email, isAdmin = false){
    const hash = bcrypt.hashSync(password, credentials.bcryptConfig.saltRounds);
    knex('users').insert({username: username, password: hash, email: email, isadmin: isAdmin})
        .then(() => {
            console.log(`New user ${username} created.`);
        });
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
function getOneUserFromDB(bundle){
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
async function userExistsInDB(bundle) {
    let response = await getOneUserFromDB(bundle);
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
async function updateUserFromDB(bundle, params){
    const VALID_PROPERTIES = ['username', 'password', 'email'];
    const toUpdate = VALID_PROPERTIES.filter((value) => Object.keys(params).includes(value));
    //If the params object has none of the VALID_PROPERTIES defined, then send out an error
    if(!(toUpdate.length)){
        throw new TypeError('Params object is not correct');
    }
    // If the user does not exist throw error
    if(!(await userExistsInDB(bundle))) throw new DatabaseError('User does not exist');
    //Build a new object that will be used to update the user properties
    let updater = {};
    for (const key of toUpdate) {
        if(params[key]) {
            updater[key] = params[key];
        }
    }
    if(bundle.id){
        return knex('users').where('id', bundle.id).update(updater);
    }else if(bundle.username){
        return knex('users').where('username', bundle.username).update(updater);
    }
}



module.exports = {
    //In case it is needed for specific querys
    queryBuilder: knex,
    addNewUserToDB: addNewUserToDB,
    getOneUserFromDB: getOneUserFromDB,
    updateUserFromDB: updateUserFromDB,
    userExistsInDB: userExistsInDB,
};

