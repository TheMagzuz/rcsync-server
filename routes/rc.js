const express = require('express')
const router = express.Router();

const multer = require('multer');

const fs = require('fs');
const path = require('path');

const randomWords = require('random-words');

const tokens = require('../tokens');
const users = require('../database');

router.post('/create', multer().single('rc'), (req, res) => {
    const username = tokens.decode(req.headers.authorization).username;

    if (users.userExists(username)) {
        const userpath = path.join(users.usersPath, username);

        var id = randomWords({exactly: 1, formatter: (word) => word.slice(0,1).toUpperCase() + word.slice(1), wordsPerString: 3, seperator: ""})[0].split(" ").join("");
        var filePath = users.usersPath + '/' + username + '/' + id;

        // I doubt this will ever be needed, but better safe than sorry
        while (fs.existsSync(filePath)) {
            id = randomWords({exactly: 1, formatter: (word) => word.slice(0,1).toUpperCase() + word.slice(1), wordsPerString: 3, seperator: ""})[0].split(" ").join("");
            filePath = users.usersPath + '/' + username + '/' + id;
        }

        fs.writeFile(filePath, req.file.buffer, (err) => {
            const userInfo = users.getUser(username); 

            userInfo.rcs.push({id: id, visibility: req.body.visibility || 'unlisted'});

            users.writeUser(userInfo, undefined, (err) => {
                res.status(201).send(id); 
            });

        });

        return;

    } else {
        res.status(401).end();
        return;
    }

    res.status(500).end();
});

router.get('/rc/:user/:id', (req, res) => {
    if (!users.userExists(req.params.user) || !users.hasRc(req.params.user, req.params.id)) {
        
    }
});

module.exports = router;
