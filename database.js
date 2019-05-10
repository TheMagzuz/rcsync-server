var exports = module.exports = {}

const fs = require('fs');

exports.usersPath = __dirname + '/../db/';

/**
 * Check if a user exists
 * @param {string} username The user to check
 * @return {boolean} If the user exists
 */
exports.userExists = (username) => {
    return fs.existsSync(usersPath + username);
}
