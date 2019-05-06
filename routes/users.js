var express = require('express');
var router = express.Router();

const fs = require('fs');

const usersPath = __dirname + '/users/';

router.post('/register', (req, res, next) => {
    var username = req.body.username;
    if (fs.existsSync(usersPath + username)) {
        res.status(500).send('User already exists');
    }
})

module.exports = router;
