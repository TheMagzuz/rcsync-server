var exports = module.exports = {}

const fs = require('fs');
const path = require('path');

const usersPath = __dirname + '/db/';

exports.usersPath = usersPath;

/**
 * Check if a user exists
 * @param {string} username The user to check
 * @return {boolean} If the user exists
 */
exports.userExists = (username) => {
    return fs.existsSync(usersPath + username);
}

exports.getUser = (username) => {
    return JSON.parse(fs.readFileSync(usersPath + username + '/userinfo.json'));
}

exports.writeUser = (userinfo, username=userinfo.username, callback) => {
    fs.writeFile(usersPath + username + '/userinfo.json', JSON.stringify(userinfo), callback);
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
    rc.likes++;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
}

exports.unlikeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.likes--;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
}

exports.dislikeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.dislikes++;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
}

exports.undislikeRC = (username, id, callback) => {
    var user = exports.getUser(username);
    var rcIndex = user.rcs.findIndex(rc => rc.id == id);
    var rc = user.rcs[rcIndex];
    rc.dislikes--;
    user.rcs[rcIndex] = rc;
    exports.writeUser(user, username, callback)
}
