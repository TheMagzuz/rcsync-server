var express = require('express');
var router = express.Router();

const tokens = require('../tokens')

router.get('/rc/:user/:rc', function(req, res, next) {
    var decoded;
    try {
        console.log(req.user);
    } catch (e) {
        res.status(500).end();
    }
});

module.exports = router;
