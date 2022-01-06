const {
    credentials
} = require('../config/config');
const router = require('express').Router();
const authRequisites = require('../auth/auth-middleware');
const db = require('../db/db');

router.get('/latest_record', authRequisites.RequiresAdminAPI, (req, res) => {
    db.GetLatestRecordFromDB().then((record) => {
        res.json(record);
    });
});

router.post('/latest_record', (req, res) => {
    if (credentials.api.keys.includes(req.body.key)) {
        db.AddRecordToDB(req.body.record.timestamp, req.body.record.light, req.body.record.temperature,
            req.body.record.ledLevel)
            .then(() => res.status(200).json({
                msg: 'OK'
            }))
            .catch((err) => {
                console.log('API error: ' + err);
                res.status(500).json({
                    msg: 'SERVER ERROR'
                });
            });
        return;
    }
    res.status(401).json({
        msg: 'ERROR invalid credentials'
    });
});

router.get('/records', authRequisites.RequiresAdminAPI, (req, res) => {
    db.GetAllRecordsFromDB().then((recordsList) => {
        res.json(recordsList);
    }).catch((err) => {
        console.log('API error:' + err);
        res.status(500).json({msg:'SERVER ERROR'});
    });
});

router.get('/suggestions', authRequisites.RequiresAdminAPI, (req, res) => {
    const page = req.query.page || 0;
    db.GetSuggestionsPage(page).then((suggestrionsList) => {
        res.json(suggestrionsList);
    }).catch((err) => {
        console.log('API error: ' + err);
        res.status(500).json({msg:'SERVER ERROR'});
    });
});

module.exports = router;