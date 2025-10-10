const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const sanitizer = require('express-mongo-sanitize');
const xssclean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');


const appError = require('./utils/appError');
const globalErrHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const hsRouter = require('./routes/hungerSpotRouter');
const volRouter = require('./routes/volRouter');
const donorRouter = require('./routes/donorRouter');

const app = express();

// 1) MIDDLEWARES

app.use(cors({
    origin: '*',
    credentials: true
}));
app.options('*', cors());

app.use(helmet());

if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(sanitizer());

app.use(xssclean());

app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

app.use(express.json());

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// 3) ROUTES

app.use('/api/v1/users', userRouter);
app.use('/api/v1/hungerSpots', hsRouter);
app.use('/api/v1/donor', donorRouter);
app.use('/api/v1/volunteer', volRouter);

app.all('*', (req, res, next) => {
    next(
        new appError(`Can't find ${req.originalUrl} on this server.`, 404)
    );
});

app.use(globalErrHandler);

module.exports = app;

