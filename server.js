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
dotenv.config({path: './config.env'});
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
const server = app.listen(port, () => {
    console.log(`App Running on Port: ${port}`);
});
