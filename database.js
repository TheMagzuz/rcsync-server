var exports = module.exports = {}

const co = require('co');

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const thunkify = require('thunkify');

const MongoClient = require('mongodb').MongoClient;

const dbURL = fs.readFileSync(path.join(__dirname, 'dbURL.cfg')).toString();

// Enable dev mode if the devMode.cfg file exists
const devMode = fs.existsSync('devMode.cfg');

var client, db, usersCollection, rcsView;

var dbName;
var usersPath = __dirname + '/db/';

if (process.env.UNIT_TEST) {
    dbName = "test";
} else if (devMode) {
    dbName = "dev"
} else {
    dbName = "prod"
}

usersPath += dbName + '/';
exports.usersPath = usersPath;

if (!fs.existsSync(usersPath)) {
    fs.mkdirSync(usersPath);
}

exports.ready = co(function*() {
    client = yield MongoClient.connect(dbURL, {useNewUrlParser: true});
    db = client.db(dbName);
    usersCollection = db.collection("users")
})


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
    return usersCollection.updateOne({username: username}, {$set: userinfo}, {upsert: true});
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

exports.getRcs = (owner) => {
    return co(function*() {
        user = yield exports.getUser(owner)
        return user.rcs;
    })
}

exports.likeRC = (username, id) => {
    return co(function*() {
        if (!exports.hasRc(username, id)) {
            return Promise.reject();
        }
        usersCollection.updateOne({username: username, "rcs.id": id}, {$inc: {"rcs.likes": 1}});
    })
}

exports.unlikeRC = (username, id) => {
    return co(function*() {
        if (!exports.hasRc(username, id)) {
            return Promise.reject();
        }
        usersCollection.updateOne({username: username, "rcs.id": id}, {$inc: {"rcs.likes": -1}});
    })
}

exports.dislikeRC = (username, id) => {
    return co(function*() {
        if (!exports.hasRc(username, id)) {
            return Promise.reject();
        }
        usersCollection.updateOne({username: username, "rcs.id": id}, {$inc: {"rcs.dislikes": 1}});
    })
}

exports.undislikeRC = (username, id) => {
    return co(function*() {
        if (!exports.hasRc(username, id)) {
            return Promise.reject();
        }
        return usersCollection.updateOne({username: username, "rcs.id": id}, {$inc: {"rcs.dislikes": -1}});
    })
}

exports.pushLike = (username, rcOwner, id) => {
    return co(function*() {
       return usersCollection.updateOne({username: username}, {$push: {"$.likes": `${rcOwner}/${id}`} });
    })
}

exports.pullLike = (username, rcOwner, id) => {
    return co(function*() {
       return usersCollection.updateOne({username: username}, {$pull: {"$.likes": `${rcOwner}/${id}`} });
    })
}

exports.pushDislike = (username, rcOwner, id) => {
    return co(function*() {
       return usersCollection.updateOne({username: username}, {$push: {"$.dislikes": `${rcOwner}/${id}`} });
    })
}

exports.pullDislike = (username, rcOwner, id) => {
    return co(function*() {
       return usersCollection.updateOne({username: username}, {$pull: {"$.dislikes": `${rcOwner}/${id}`} });
    })
}

exports.clearDatabase = () => {
    if (dbName != "test") {
        console.error("Tried to clear database when not in test mode, this is probably really bad");
        process.exit(1);
        return;
    }
    rimraf.sync(usersPath);
    fs.mkdirSync(usersPath);
    return usersCollection.deleteMany({});
}
exports.closeConnection = () => {
    client.close();
}
