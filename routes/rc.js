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

            userInfo.rcs.push({id: id, visibility: req.body.visibility || 'unlisted', tags: req.body.tags.split(','), name: req.body.name, description: req.body.description, likes: 0, dislikes: 0});

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

router.post('/post/:user/:id/togglelike', (req, res) => {
    if (!req.headers.authorization || !tokens.verify(req.headers.authorization)) {
        res.status(401).end();
        return;
    }

    const targetRC = `${req.params.user}/${req.params.id}`
    const username = tokens.decode(req.headers.authorization).username;
    var userinfo = users.getUser(username);


    if (!users.userExists(req.params.user) || !users.hasRc(req.params.user, req.params.id)) {
        res.status(404).end();
        return;
    }

    if (userinfo.liked.includes(targetRC)) {
       users.unlikeRC(req.params.user, req.params.id);
       userinfo.liked.splice(userinfo.liked.indexOf(targetRC));
    } else {
        if (userinfo.disliked.includes(targetRC)) {
            users.undislikeRC(req.params.username, req.params.id);
            userinfo.disliked.split(userinfo.disliked.indexOf(targetRC));
        }
        users.likeRC(req.params.user, req.params.id);
        userinfo.liked.push(targetRC);
    }

    users.writeUser(userinfo);
    res.status(200).end();
})

router.post('/:user/:id/toggledislike', (req, res) => {
    if (!req.headers.authorization || !tokens.verify(req.headers.authorization)) {
        res.status(401).end();
        return;
    }

    const targetRC = `${req.params.user}/${req.params.id}`
    const username = tokens.decode(req.headers.authorization);
    var userinfo = users.getUser(username);

    if (userinfo.disliked.includes(targetRC)) {
       users.undislikeRC(req.params.user, req.params.id);
       userinfo.disliked.splice(userinfo.disliked.indexOf(targetRC));
    } else {
        if (userinfo.liked.includes(targetRC)) {
            users.unlikeRC(req.params.username, req.params.id);
            userinfo.liked.split(userinfo.liked.indexOf(targetRC));
        }
        users.dislikeRC(req.params.user, req.params.id);
        userinfo.disliked.push(targetRC);
    }

    users.writeUser(userinfo);
    res.status(200).end();
})


module.exports = router;
