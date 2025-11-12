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

// CORS configuration - environment aware
const corsOptions = {
    credentials: true,
    optionsSuccessStatus: 200
};

if (process.env.NODE_ENV === 'production') {
    // In production, use allowed origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [process.env.URL_FRONTEND || 'https://yourdomain.com'];
    
    corsOptions.origin = (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    };
} else {
    // In development, allow all origins
    corsOptions.origin = '*';
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configure Helmet to allow map tiles
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding map tiles
}));

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

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const fs = require('fs');
    
    // In Docker, Backend files are in /app/, Frontend dist is in /app/Frontend/dist
    const distPath = path.join(__dirname, 'Frontend/dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    
    // Check if dist folder exists
    if (!fs.existsSync(distPath)) {
        console.error('ERROR: Frontend dist folder not found at:', distPath);
    }
    
    // Serve static files from the React app
    app.use(express.static(distPath));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res, next) => {
        // Skip API routes (they should be handled above, but just in case)
        if (req.path.startsWith('/api/')) {
            return next();
        }
        
        // Check if index.html exists before trying to send it
        if (!fs.existsSync(indexHtmlPath)) {
            console.error('ERROR: index.html not found at:', indexHtmlPath);
            return next(new appError('Frontend build not found. Please rebuild the application.', 500));
        }
        
        res.sendFile(indexHtmlPath, (err) => {
            if (err) {
                console.error('Error sending index.html:', err);
                next(err);
            }
        });
    });
} else {
    // In development, return 404 for non-API routes
    app.all('*', (req, res, next) => {
        next(
            new appError(`Can't find ${req.originalUrl} on this server.`, 404)
        );
    });
}

// Error handler must be last
app.use(globalErrHandler);

module.exports = app;

