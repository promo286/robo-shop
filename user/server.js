const instana = require('@instana/collector');
// init tracing
// MUST be done before loading anything else!
instana({
    tracing: {
        enabled: true
    }
});

const { MongoClient } = require('mongodb');
const redis = require('redis');
const bodyParser = require('body-parser');
const express = require('express');
const pino = require('pino');
const expPino = require('express-pino-logger');

let db;
let usersCollection;
let ordersCollection;
let mongoConnected = false;

const logger = pino({
    level: 'info',
    prettyPrint: false,
    useLevelLabels: true
});
const expLogger = expPino({
    logger: logger
});

const app = express();

app.use(expLogger);

app.use((req, res, next) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

app.use((req, res, next) => {
    let dcs = [
        "asia-northeast2",
        "asia-south1",
        "europe-west3",
        "us-east1",
        "us-west1"
    ];
    let span = instana.currentSpan();
    span.annotate('custom.sdk.tags.datacenter', dcs[Math.floor(Math.random() * dcs.length)]);

    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/health', (req, res) => {
    res.json({
        app: 'OK',
        mongo: mongoConnected
    });
});

// use REDIS INCR to track anonymous users
app.get('/uniqueid', (req, res) => {
    redisClient.incr('anonymous-counter', (err, r) => {
        if (!err) {
            res.json({
                uuid: 'anonymous-' + r
            });
        } else {
            req.log.error('ERROR', err);
            res.status(500).send(err);
        }
    });
});

// check user exists
app.get('/check/:id', (req, res) => {
    if (mongoConnected) {
        usersCollection.findOne({ name: req.params.id }).then((user) => {
            if (user) {
                res.send('OK');
            } else {
                res.status(404).send('user not found');
            }
        }).catch((e) => {
            req.log.error(e);
            res.status(500).send(e);
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// return all users for debugging only
app.get('/users', (req, res) => {
    if (mongoConnected) {
        usersCollection.find().toArray().then((users) => {
            res.json(users);
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send(e);
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

app.post('/login', (req, res) => {
    req.log.info('login', req.body);
    if (req.body.name === undefined || req.body.password === undefined) {
        req.log.warn('credentails not complete');
        res.status(400).send('name or passowrd not supplied');
    } else if (mongoConnected) {
        usersCollection.findOne({
            name: req.body.name,
        }).then((user) => {
            req.log.info('user', user);
            if (user) {
                if (user.password == req.body.password) {
                    res.json(user);
                } else {
                    res.status(404).send('incorrect password');
                }
            } else {
                res.status(404).send('name not found');
            }
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send(e);
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// connect to Redis
var redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'redis'
});

redisClient.on('error', (e) => {
    logger.error('Redis ERROR', e);
});
redisClient.on('ready', (r) => {
    logger.info('Redis READY', r);
});

// set up Mongo using async/await for improved error handling
async function mongoLoop() {
    const mongoURL = process.env.MONGO_URL || 'mongodb+srv://Demo:oH22Yx4VNG0X8dNo@monogo-db.kz9hy.mongodb.net/?retryWrites=true&w=majority&appName=monogo-db';
    console.log("Connecting to MongoDB URL:", mongoURL);
    try {
        const client = await MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db('users');
        usersCollection = db.collection('users');
        ordersCollection = db.collection('orders');
        mongoConnected = true;
        logger.info('MongoDB connected');
    } catch (error) {
        logger.error('MongoDB connection failed. Database not connected. Retrying in 2000ms...', error);
        setTimeout(mongoLoop, 2000);
    }
}

mongoLoop();

// fire it up!
const port = process.env.USER_SERVER_PORT || '8080';
app.listen(port, () => {
    logger.info('Started on port', port);
});
