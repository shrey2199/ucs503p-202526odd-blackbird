process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION ! Shutting Down !');
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION ! Shutting Down !');
    server.close(() => {
        process.exit(1);
    });
});

const dotenv = require('dotenv');
const path = require('path');
const https = require('https');
const fs = require('fs');
// Load .env from project root (one level up from Backend folder)
dotenv.config({path: path.join(__dirname, '..', '.env')});
const mongoose = require('mongoose');

const app = require('./app');

const db_uri = process.env.DATABASE_URI.replace(
    '<PASSWORD>', 
    process.env.DATABASE_PASSWD
);

const dbcon = async (uri) => {
    try {
        await mongoose.connect(uri);
        console.log('DB Connection Successful.');
    } catch(err) {
        console.log('DB Connection Failed.');
        server.close(() => {
            process.exit(1);
        })
    }
};

dbcon(db_uri);

const port = process.env.PORT || 8000;

// Only use HTTPS in development with localhost certificates
const isDevelopment = process.env.NODE_ENV !== 'production';
const certPath = path.join(__dirname, '..', 'certs', 'localhost+1.pem');
const keyPath = path.join(__dirname, '..', 'certs', 'localhost+1-key.pem');

let server;

if (isDevelopment && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    // Use HTTPS only in development if certificates are available
    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
    
    server = https.createServer(options, app).listen(port, '0.0.0.0', () => {
        console.log(`App Running on HTTPS Port: ${port}`);
        console.log(`Access at: https://localhost:${port}`);
    });
} else if (isDevelopment) {
    // If development and certificates don't exist, use HTTP
    server = app.listen(port, '0.0.0.0', () => {
        console.log(`App Running on HTTP Port: ${port}`);
        console.log(`Access at: http://localhost:${port}`);
    });
} else {
    // In production
    server = app.listen(port, '0.0.0.0', () => {
        console.log(`App Running on Port: ${port}`);
    });
}
