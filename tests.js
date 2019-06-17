const co = require('co');
const assert = require('assert');
const request = require('supertest');

const database = require('./database');

describe('user manager', () => {
    var server;
    before(() => {
        return database.ready;
    })
    beforeEach(() => {
        www = require('./bin/www');
        console.log(www)
        server = www.server;
        console.log(server)
        return database.clearDatabase();
    });
    afterEach(() => {
        server.close();
    })
    after(() => process.exit(0));
    it('400 if password is not given', (done) => {
        request(server).post('/users/register').send({password: "password"}).expect(400, done);
    });
    it('400 if username is not given', (done) => {
        request(server).post('/users/register').send({username: "username"}).expect(400, done);
    });
    it('201 if username and password is given', (done) => {
        request(server).post('/users/register').send({username: "username", password: "password"}).expect(201, done);
    })
    it('properly authenticate', (done) => {
        co(function*() {
            yield request(server).post('/users/register').send({username: "username", password: "password"})
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
