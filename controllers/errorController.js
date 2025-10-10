const appError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new appError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field value: "${Object.keys(err.keyValue)}". Please use another value.`
    return new appError(message, 400);
}

const handleValidationErrorDB = err => {
    let errors = '';
    for(const key in err.errors) {
        errors = errors + `${err.errors[key].message} `;
    }
    const message = `Invalid Data in Fields: ${errors}`;
    return new appError(message, 400);
}

const handleJWTError = err => {
    return new appError('Invalid Token. Pls login Again.', 401);
}

const handleJWTExpiredError = err => {
    return new appError('Token has Expired. Pls login Again.', 401);
}

const sendDevErr = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        err: err,
        message: err.message,
        stack: err.stack
    });
};

const sendProdErr = (err, res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {

        // console.log('Error 🔥', err);

        res.status(500).json({
            status: 'error',
            message: 'Something Went Wrong !'
        });
    }
};


module.exports = (err, req, res, next) => {

    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        
        sendDevErr(err, res);

    } else {

        let error = err;

        if (error.name === 'CastError') { 
            error = handleCastErrorDB(error);
        }

        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        }

        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }

        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError(error);
        }

        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError(err);
        }

        sendProdErr(error, res);
    }

    next();
}