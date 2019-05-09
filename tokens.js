const jwt = require('jsonwebtoken');

const fs = require('fs');

const privateKey = fs.readFileSync(__dirname + '/private.key');
const publicKey = fs.readFileSync(__dirname + '/publickey');

var exports = module.exports = {}

exports.getToken = (username, expiresIn) => {
    return jwt.sign({username: username}, privateKey, {expiresIn: expiresIn, algorithm: 'RS256'});
}

exports.verify = (token) => {
    return jwt.verify(token, publicKey);
}

exports.privateKey = privateKey;
exports.publicKey = publicKey;
