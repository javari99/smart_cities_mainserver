const router = require('express').Router();
const {body: bodyValidator, validationResult} = require('express-validator');
const authRequisites = require('../auth/auth-middleware'); 
const db = require('../db/db');



/**
 * returns a router configured with he passport instance provided,
 * includes the routes used for authentication such as login, logout and register
 * 
 * @param {import('passport').PassportStatic} passport
 * @returns {Express.Router}
 */
module.exports = (passport) => {
    router.get('/login', authRequisites.RequiresNotLogin,(req, res) => {
        res.render('login');
    });

    router.post('/login', 
        authRequisites.RequiresNotLogin,
        bodyValidator('username').trim().escape(),
        bodyValidator('password').trim(),
        passport.authenticate('local', {failureRedirect:'/auth/login'}), 
        (req, res) => {
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

    router.get('/register', authRequisites.RequiresNotLogin, (req, res) => {
        res.render('register');
    });
    
    
    router.post('/register',
        authRequisites.RequiresNotLogin,
        bodyValidator('username').not().isEmpty(),
        bodyValidator('password').trim().isAlphanumeric().isLength({min:8}),
        bodyValidator('email').trim().isEmail(),
        (req, res) => {
            //Check validator errors
            const errors = validationResult(req);
            if(! errors.isEmpty()) {
                req.session.flash = {
                    type: 'danger',
                    message: errors[0].msg,
                };
                return res.render('/suggestions');
            }

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
    return router;
};