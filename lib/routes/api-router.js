const {
    credentials
} = require('../config/config');
const router = require('express').Router();
const authRequisites = require('../auth/auth-middleware');
const db = require('../db/db');
const axios = require('axios');

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
    const page = req.query.page || 0;
    db.GetRecordsPage(page).then((recordsList) => {
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

//TODO: Post requests for router api
//TODO: Add support for automatic mode in motes
router.post('/ledLevel', authRequisites.RequiresAdminAPI,(req, res) => {
    const moteId = req.body.mote_id;
    if(!('mote_id' in req.body)){
        res.status(404).json({msg: 'Mote id not specified'});
        return;
    }
    const level = req.body.level;
    const mode = req.body.mode;
    if(!(level || mode)){
        res.status(404).json({msg:'No mode or level specified'});
        return;
    }

    const body = {
        key: credentials.api.keys[0],
        mote:{
            id:moteId,
            mode: mode,
            ledLevel:level,
        },
    };
    axios({
        method: 'post',
        url:'http://router.smartercity.es/api/ledlevel',
        data: body,
    }).then((resp) => {
        res.json({msg: resp.msg});
    }).catch((err) => {
        console.log(err);
        res.status(404).json({msg:'Error: could not communicate motes'});
    });

});

module.exports = router;