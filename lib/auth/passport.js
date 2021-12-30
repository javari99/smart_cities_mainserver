const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;


/**
 * Passportjs authentication configuration, when correctly authenticated, the user is deserialized into
 * req.user
 * 
 * @param {import('passport').PassportStatic} passport
 * @param {any} db
 * @returns {void}
 */
module.exports = (passport, db) => {
    passport.use(new localStrategy((username, password, cb) => {
        db.GetOneUserFromDB({username: username}).then((user) =>{
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    cb(null, {id: user.id, username: user.username, email: user.email, isAdmin: user.isadmin});
                } else {
                    cb(null, false);
                }
            });
        }).catch((err) => {
            cb(err, false);
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id); //Just store the user id under the session
    });

    passport.deserializeUser((id, cb) => {
        db.GetOneUserFromDB({id:id}).then((user) => {
            cb(null, {id: user.id, username: user.username, email: user.email, isAdmin: user.isadmin});
        }).catch((err) => {
            return cb(err);
        });
    });

};