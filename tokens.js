const jwt = require('jsonwebtoken');

const fs = require('fs');

const privateKey = fs.readFileSync(__dirname + '/private.key');

var exports = module.exports = {}

exports.getToken = (username, expiresIn) => {
    return jwt.sign({username: username}, privateKey, {expiresIn: expiresIn});
}
