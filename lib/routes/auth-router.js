const router = require('express').Router();
const authRequisites = require('../auth/auth-middleware');
const db = require('../db/db');



/**
 * returns a router configured witht he passport instance provided,
 * includes the routes used for authentication
 * 
 * @param {import('passport').PassportStatic} passport
 * @returns {Express.Router}
 */
module.exports = (passport) => {
    router.get('/login', (req, res) => {
        res.render('login');
    });

    router.post('/login', passport.authenticate('local', {failureRedirect:'/auth/login'}), (req, res) => {
        res.redirect('/');
    });

    router.get('/logout', (req, res, next) => {
        //Destroy the session otherwise the logout is not reliable
        req.session.destroy((err) => {
            if(err) next(err);
            req.logout();
            res.redirect('/');
        });
    });

    router.get('/register', (req, res) => {
        res.render('register');
    });
    
    
    router.post('/register', (req, res) => {
        //TODO: validate input
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        
        db.AddNewUserToDB(username, password, email, false)
        /* eslint-disable no-unused-vars*/
            .then((resp) => {
                res.redirect('/auth/login');
                req.session.flash = {
                    type: 'success',
                    message: 'User succesfully registered, please login into your account to continue.'
                };
            })
            .catch(err => {
                req.session.flash = {
                    type: 'danger',
                    message: `Could not register user, reason: ${err.detail}.`
                };
                res.redirect('/auth/register');
            });
        /* eslint-enable no-unused-vars*/
    });

    router.get('/test', authRequisites.RequiresLogin, (req, res) => {
        res.render('index');
    });
    return router;
};