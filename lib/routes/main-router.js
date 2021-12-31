const router = require('express').Router();
const authRequisites = require('../auth/auth-middleware');
const db = require('../db/db');

router.get('/', (req, res) => res.render('index'));
router.get('/user', authRequisites.RequiresLogin, (req,res) => {
    db.GetAllUserSuggestionsFromDB(req.user.id).then((suggestionsList) => {
        res.render('user', {suggestionsList: suggestionsList});
    });
});

module.exports = router;