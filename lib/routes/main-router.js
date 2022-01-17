const router = require('express').Router();
const {body: bodyValidator, validationResult} = require('express-validator'); 
const authRequisites = require('../auth/auth-middleware');
const db = require('../db/db');


module.exports = (scriptUrl) =>{

    router.get('/', (req, res) => res.render('index'));
    router.get('/user', authRequisites.RequiresLogin, (req,res) => {
        db.GetAllUserSuggestionsFromDB(req.user.id).then((suggestionsList) => {
            res.render('user', {suggestionsList: suggestionsList});
        });
    });

    router.get('/suggestions', authRequisites.RequiresLogin, (req, res) =>{
        res.render('suggestions');
    });

    router.post('/suggestions', authRequisites.RequiresLogin, 
        bodyValidator('message').not().isEmpty().trim().escape(),
        bodyValidator('rating').toInt().isInt({min:0, max:10}),
        (req, res) => {
            //Check validator errors
            const errors = validationResult(req);
            if(!errors.isEmpty()) {
                req.session.flash = {
                    type: 'danger',
                    message: errors[0].msg,
                };
                return res.render('/suggestions');
            }

            const message = req.body.message;
            const rating = +req.body.rating;
            const userid = req.user.id;

            db.AddSuggestionToDB(userid, message, rating)
                .then(() => {
                    req.session.flash = {
                        type: 'success',
                        message: 'The suggestion was succesfully received.'
                    };
                    res.redirect('/');
                })
                .catch((err) => {
                    console.log('Error registering suggestion:' + err);
                    req.session.flash = {
                        type: 'danger',
                        message: 'An error ocurred, please try again.'
                    };
                    res.redirect('/suggestions');
                });

        });

    router.get('/admin/dashboard', authRequisites.RequiresAdmin, async (req, res) => {
        try{
            const suggestionsList = await db.GetSuggestionsPage();
            const recordsList = await db.GetRecordsPage();
            const distincMotes = await db.GetDistinctMotes();
            res.render('dashboard', {
                suggestionsList: suggestionsList,
                recordsList: recordsList,
                distincMotes: distincMotes, 
                scriptUrl:scriptUrl,
            });
        }catch(err){
            console.log(err);
        }
    });

    return router; 
};