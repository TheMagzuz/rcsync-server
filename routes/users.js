var express = require('express');
var router = express.Router();

const fs = require('fs');

const tokens = require('../tokens.js');

const usersPath = __dirname + '/../db/';

const bcrypt = require('bcrypt');
const saltRounds = 10;

router.post('/register', (req, res, next) => {
    const userinfo = {username: req.body.username, email: req.body.email, hash: undefined};

    console.log(req.body);

    if (fs.existsSync(usersPath + userinfo.username)) {
        res.status(500).json({error: "User already exists"});
        return;
    }

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(userinfo.password, salt, function(err, hash) {

            userinfo.hash = hash;

            fs.mkdirSync(usersPath + userinfo.username);
            fs.writeFileSync(usersPath + userinfo.username + 'userinfo.json', JSON.stringify(userinfo));

            res.status(201).json(tokens.getToken(userinfo.username, "2h"));
        });
    })

})

module.exports = router;
