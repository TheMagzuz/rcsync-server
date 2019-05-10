const express = require('express')
const router = express.Router();

const multer = require('multer');

const fs = require('fs');
const path = require('path');

const randomWords = require('random-words');

const tokens = require('../tokens');
const users = require('../database');

router.post('/create', multer().single('rc'), (req, res, err) => {
    const username = tokens.decode(req.headers.authorization).username;

    if (users.userExists(username)) {
        const userpath = path.join(users.usersPath, username);
        
        const id = randomWords({exactly: 3, formatter: (word) => word.slice(0,1).toUpperCase() + word.slice(1), wordsPerString: 3, seperator: ""})
        console.log(id)
    }

    res.status(200).end();
})

module.exports = router;
