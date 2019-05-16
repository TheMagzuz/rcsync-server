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

router.get('/get/:user/:id', (req, res) => {
    if (!users.userExists(req.params.user) || !users.hasRc(req.params.user, req.params.id)) {
        res.status(404).end();
        return;
    }
    const rc = users.getRcInfo(req.params.user, req.params.id);

    if (req.headers.authorization && !tokens.verify(req.headers.authorization)) {
        res.status(401).send('Invalid token, try logging in again');
        return;
    }

    var username;

    if (req.headers.authorization) {
        username = tokens.decode(req.headers.authorization);
    }

    if (rc.visibility == 'private') {
        if (!username) {
            res.status(404).end();
        } else if (req.params.username.toLower() === username.toLower()) {
            res.status(200).sendFile(__dirname + '/../db/' + username + '/' + req.params.id);
        } else {
            res.status(400).end()
        }
        return;
    } else {
        const options = { root:__dirname + '/../db/' };
        res.status(200).sendFile('./' + req.params.user+ '/' + req.params.id, options);
    }
});

module.exports = router;
