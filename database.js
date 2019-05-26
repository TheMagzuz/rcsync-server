var exports = module.exports = {}

const co = require('co');

const fs = require('fs');
const path = require('path');

const MongoClient = require('mongodb').MongoClient;

const dbURL = fs.readFileSync(path.join(__dirname, 'dbURL.cfg')).toString();

// Enable dev mode if the devMode.cfg file exists
const devMode = fs.existsSync('devMode.cfg');

var client, db, usersCollection;

co(function*() {
    client = yield MongoClient.connect(dbURL, {useNewUrlParser: true});
    db = client.db(devMode ? "dev" : "prod");
    usersCollection = db.collection("users")
})

const usersPath = __dirname + '/db/';

exports.usersPath = usersPath;

// TODO: Rewrite to exclusivley use MongoDB

/**
 * Check if a user exists
 * @param {string} username The user to check
 * @return {boolean} If the user exists
 */
exports.userExists = (username) => {
    return co(function*() {
        count = yield usersCollection.countDocuments({username: username});
        return count > 0;
    })
}

exports.getUser = (username) => {
    return usersCollection.findOne({username: username});
}

exports.writeUser = (userinfo, username=userinfo.username) => {
    return usersCollection.update({username: username}, userInfo, {upsert: true});
}

exports.hasRc = (username, id) => {
    return fs.existsSync(path.join(usersPath, username, id));
}

exports.getRcInfo = (username, id) => {
    return co(function*() {
        const user = yield usersCollection.findOne({username: username, "rcs.id": id});
        const rc = user.rcs.find(r => r.id == id);
        return rc;
    })
}

exports.addRc = (owner, rcInfo) => {
    return usersCollection.updateOne({username: owner}, {$push: {rcs: rcInfo}});
}

exports.likeRC = (username, id) => {
    return co(function*() {
        if (!exports.hasRc(username, id)) {
            return Promise.reject();
        }
        usersCollection.update({username: username, "rcs.id": id}, {$inc: {"rcs.likes": 1}});
    })
}

exports.unlikeRC = (username, id) => {
    return co(function*() {
        if (!exports.hasRc(username, id)) {
            return Promise.reject();
        }
        usersCollection.update({username: username, "rcs.id": id}, {$inc: {"rcs.likes": -1}});
    })
}

exports.dislikeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.dislikes = rc.dislikes + 1 || 1;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
        rc.owner = username;
    db.update({id: id}, rc, {upsert: true}, (err, numReplaced) => {});
}

exports.undislikeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.dislikes = rc.dislikes - 1 || 1;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
        rc.owner = username;
    db.update({id: id}, rc, {upsert: true}, (err, numReplaced) => {});
}
