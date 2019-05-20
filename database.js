var exports = module.exports = {}

const co = require('co');

const fs = require('fs');
const path = require('path');

const Datastore = require('nedb');

const publicRCdb = new Datastore({filename: path.join(__dirname, 'db', 'publicRCs.db'), autoload: true});
const usersdb = new Datastore({filename: path.join(__dirname, 'db', 'users.db'), autoload: true});

const usersPath = __dirname + '/db/';

exports.usersPath = usersPath;

// TODO: Rewrite to exclusivley use nedb

/**
 * Check if a user exists
 * @param {string} username The user to check
 * @return {boolean} If the user exists
 */
exports.userExists = (username) => {
        return new Promise((resolve, reject) => {
            usersdb.count({username: username}, (err, count) => {
                if (err) reject(err);
                else resolve(count > 0);
            })
        })
}

exports.getUser = (username) => {
    return co(function*() {
        return yield usersdb.findOne({username: username});
    })
}

exports.writeUser = (userinfo, username=userinfo.username) => {
    return co(function*() {
        return usersdb.update({username: username}, userinfo, {upsert: true});
    });
}

exports.hasRc = (username, id) => {
    return fs.existsSync(path.join(usersPath, username, id));
}

exports.getRcInfo = (username, id) => {
    return exports.getUser(username).rcs.find(rc => rc.id == id);
}

exports.likeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.likes = rc.likes + 1 || 1;
    user.rcs[rcIndex] = rc;
    console.log(user);
    exports.writeUser(user, username, callback);
    rc.owner = username;
    db.update({id: id}, rc, {upsert: true}, (err, numReplaced) => {});
}

exports.unlikeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.likes = rc.likes - 1 || 1;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
        rc.owner = username;
    db.update({id: id}, rc, {upsert: true}, (err, numReplaced) => {});
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
