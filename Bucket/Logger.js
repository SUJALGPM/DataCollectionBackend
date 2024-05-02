const { createLogger, transports, format, log } = require("winston");
const winstonMongoDB = require('winston-mongodb');


//Mongodb connection url...
const MONGO_URL = "mongodb+srv://root:root@cluster1.f2lkxq5.mongodb.net/custom?retryWrites=true&w=majority"


// Define custom logging levels...
const customLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};


// Define custom format levels...
const FileCustomFormat = format.combine(
    format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
    format.printf(({ timestamp, level, message, body }) => {
        return `${timestamp} [${level.toUpperCase()}] ${message} ${body ? JSON.stringify(body) : ''}`;
    })
);


const DatabaseCustomFormat = format.combine(
    format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
    format.printf(({ timestamp, level, message, body }) => {
        return `${timestamp} [${level.toUpperCase()}] ${message} ${body ? JSON.stringify(body) : ''}`;
    }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.json()
);


// Create logger to store logs in specific File...
const logger = createLogger({
    levels: customLevels,
    transports: [
        new transports.File({
            filename: 'WinstonLogs/ServerLogs.log',
            level: 'verbose',
            // format: format.combine(format.simple(), format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }))
            format: FileCustomFormat
        }),

        new transports.MongoDB({
            level: 'verbose',
            db: MONGO_URL,
            options: { useUnifiedTopology: true },
            collection: 'ServerLogs',
            format: DatabaseCustomFormat
        })
    ]
});


// Create a child logger with additional metadata...
const childLogger = logger.child({ module: 'exampleModule' });


//Create middleware for whole express application...
const loggerMiddleware = (req, res, next) => {
    // const currentTime = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    logger.verbose(`${req.method} ${req.url} :`, { body: req.body });
    res.on('finish', () => {
        logger.verbose(`${req.method} ${req.url} - ${res.statusCode} `);
    });
    next();
};








module.exports = { logger, loggerMiddleware };
