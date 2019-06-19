const co = require('co');
const assert = require('assert');
const request = require('supertest');

const fs = require('fs');

const database = require('./database');

const specialCharacters = [
    '/', '\u0000', 'ø', '.', '\u001A', '\'', '"'
]

describe('RCSync server', () => {
    var server;
    before(() => {
        fs.writeFileSync('./testRC', 'testrc');
        return database.ready;
    })
    beforeEach(() => {
        www = require('./bin/www');
        server = www.server;
        return database.clearDatabase();
    });
    afterEach(() => {
        server.close();
    })
    after(() => {
        database.closeConnection()
        fs.unlinkSync('./testRC');
    });
    it('400 if password is not given', (done) => {
        request(server).post('/users/register').send({password: "password"}).expect(400, done);
    });
    it('400 if username is not given', (done) => {
        request(server).post('/users/register').send({username: "username"}).expect(400, done);
    });
    it('201 if username and password is given', (done) => {
        request(server).post('/users/register').send({username: "username1", password: "password"}).expect(201, done);
    })
    for (var c of specialCharacters) {
        it(`reject usernames starting with special characters (${JSON.stringify(c)})`, (done) => {
            request(server).post('/users/register').send({username: `${c}username`}).expect(400, done);
        })
        it(`reject usernames containing special characters (${JSON.stringify(c)})`, (done) => {
            request(server).post('/users/register').send({username: `usern${c}ame`}).expect(400, done);
        })
        it(`reject usernames ending with special characters (${JSON.stringify(c)})`, (done) => {
            request(server).post('/users/register').send({username: `username${c}`}).expect(400, done);
        })
    }
    it('properly store user', (done) => {
        var stored, sent;
        co(function*() {
            sent = {username: "username", password: "password"}
            yield request(server).post('/users/register').send(sent);
            stored = yield database.getUser(sent.username);
        }).then(() => assert(stored.username, sent.username)).then(done).catch(done);
    });
    it('properly authenticate', (done) => {
        co(function*() {
            yield request(server).post('/users/register').send({username: "username", password: "password"});
            request(server).post('/users/login').send({username: "username", password: "password"}).expect(200, done);
        })
    })
    it('reject invalid passwords', (done) => {
        co(function*() {
            yield request(server).post('/users/register').send({username: "username", password: "password"})
            request(server).post('/users/login').send({username: "username", password: "notpassword"}).expect(401, done);
        })
    })
    it('reject invalid usernames', (done) => {
        co(function*() {
            yield request(server).post('/users/register').send({username: "username", password: "password"})
            request(server).post('/users/login').send({username: "notusername", password: "password"}).expect(401, done);
        })
    })
})
