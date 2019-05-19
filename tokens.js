const jwt = require('jsonwebtoken');

const fs = require('fs');
const database = require('./database.js');

const privateKey = fs.readFileSync(__dirname + '/private.key');
const publicKey = fs.readFileSync(__dirname + '/publickey');

var exports = module.exports = {}

exports.getToken = (username, expiresIn) => {
    return jwt.sign({username: username}, privateKey, {expiresIn: expiresIn, algorithm: 'RS256'});
}

exports.decode = (token) => {
    if (token.startsWith("Bearer")) {
        token = token.split(" ")[1];
    }

    return jwt.decode(token)

}

exports.verify = (token) => {
    if (token.startsWith("Bearer")) {
        token = token.split(" ")[1];
    }
    return jwt.verify(token, publicKey);
}

exports.privateKey = privateKey;
exports.publicKey = publicKey;
