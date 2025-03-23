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

// MongoDB
var db;
var usersCollection;
var ordersCollection;
var mongoConnected = false;

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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/health', (req, res) => {
    res.json({ app: 'OK', mongo: mongoConnected });
});

// Redis Client
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: 6379
    }
});
redisClient.on('error', (e) => logger.error('Redis ERROR', e));
redisClient.on('ready', () => logger.info('Redis READY'));
redisClient.connect();

// Unique ID API
app.get('/uniqueid', async (req, res) => {
    try {
        const id = await redisClient.incr('anonymous-counter');
        res.json({ uuid: 'anonymous-' + id });
    } catch (err) {
        logger.error('ERROR', err);
        res.status(500).send(err);
    }
});

// MongoDB Connection
async function mongoConnect() {
    try {
        const mongoURL = process.env.MONGO_URL || 'mongodb+srv://Demo:oH22Yx4VNG0X8dNo@monogo-db.kz9hy.mongodb.net/?retryWrites=true&w=majority&appName=monogo-db';
        const client = new MongoClient(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
        await client.connect();
        db = client.db('users');
        usersCollection = db.collection('users');
        ordersCollection = db.collection('orders');
        mongoConnected = true;
        logger.info('✅ MongoDB Connected Successfully');
    } catch (error) {
        logger.error('❌ MongoDB Connection Failed:', error);
        mongoConnected = false;
        setTimeout(mongoLoop, 2000);
    }
}

function mongoLoop() {
    mongoConnect().catch((e) => {
        logger.error('ERROR:', e);
        setTimeout(mongoLoop, 2000);
    });
}

mongoLoop();

// Start the server
const port = process.env.USER_SERVER_PORT || '8080';
app.listen(port, () => {
    logger.info(`✅ Started on port ${port}`);
});

