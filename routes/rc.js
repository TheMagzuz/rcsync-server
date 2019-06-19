const express = require('express')
const router = express.Router();

const co = require('co');

const multer = require('multer');

const fs = require('fs');
const path = require('path');

const randomWords = require('random-words');

const tokens = require('../tokens');
const users = require('../database');

router.post('/create', multer().single('rc'), (req, res) => {
    console.log(req.headers.authorization);
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
            co(function*() {
                const userInfo = yield users.getUser(username);

                yield users.addRc(username, {id: id, visibility: req.body.visibility || 'unlisted', tags: req.body.tags ? req.body.tags.split(',') : [], name: req.body.name, description: req.body.description, likes: 0, dislikes: 0});
                res.status(201).send(id);
            })
        });

        return;

    } else {
        res.status(401).end();
        return;
    }
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
        const options = { root:__dirname + '/../db/' };
        if (!username) {
            res.status(404).end();
        } else if (req.params.username.toLower() === username.toLower()) {
            res.status(200).sendFile('./' + req.params.user+ '/' + req.params.id, options);
        } else {
            res.status(400).end()
        }
        return;
    } else {
        res.status(200).sendFile('./' + req.params.user+ '/' + req.params.id, options);
    }
});

router.post('/post/:user/:id/togglelike', (req, res) => {
    if (!req.headers.authorization || !tokens.verify(req.headers.authorization)) {
        res.status(401).end();
        return;
    }
    co(function*() {
        const targetRC = `${req.params.user}/${req.params.id}`;
        const username = tokens.decode(req.headers.authorization).username;
        var userinfo = yield users.getUser(username);

        if (userinfo.liked.includes(targetRC)) {
            users.unlikeRC(req.params.user, req.params.id);
            users.pullLike(username, req.params.user, req.params.id)
        } else {
            users.likeRC(req.params.user, req.params.id);
            users.pushLike(username, req.params.user, req.params.id)
        }

        users.writeUser(userinfo);
    })
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
