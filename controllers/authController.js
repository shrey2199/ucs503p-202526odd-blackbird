const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendOtp = require('../utils/phone');

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)),
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {

    const otp = generateOTP();
    const newUserBody = Object.assign(req.body, {otp: otp});

    await User.create(newUserBody);

    const otpOptions = {
        from: process.env.TWILIO_FROM,
        to: `whatsapp:+91${req.body.phone}`,
        body: `Your OTP for signing up on Second Serving is: ${otp}`
    }

    await sendOtp(otpOptions, res);

    res.status(200).json({
        status: 'success',
        message: 'OTP Sent !'
    });

});

exports.verifyOtp = catchAsync(async (req, res, next) => {
    const { phone, otp } = req.body;
    
    const user = await User.findOne({phoneNumber: phone});

    if(!user || !await user.correctOtp(otp.toString(), user.otp)) {
        return next(new appError('Incorrect OTP'));
    }

    user.otp = undefined;
    user.isVerified = true;

    await user.save({
        validateBeforeSave: false
    });

    createAndSendToken(user, 201, res);

});

exports.login = catchAsync(async (req, res, next) => {
    const { phoneNumber, password } = req.body;

    if(!phoneNumber || !password) {
        return next(new appError('Pls provide phone and password', 400));
    }

    const user = await User.findOne({phoneNumber}).select('+password'); 

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new appError('Incorrect Phone or Password', 401));
    }

    // if(user.active === false) {
    //     User.findByIdAndUpdate(req.user.id, {active: true});
    // }

    createAndSendToken(user, 200, res);

});

exports.protect = catchAsync(async (req, res, next) => {

    let token;

    // access token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token) {
        return next(new appError('You are not logged in. Pls login for access.', 401));
    }

    //verify

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists

    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        return next(new appError('The user of this token does not exist', 401));
    }

    if(await currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new appError('The password was recently changed. Pls login again.', 401))
    }


    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array
        if(!roles.includes(req.user.userType)) {
            return next(
                new appError('You do not have permission to perform this action.', 403)
            );
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ phoneNumber: req.body.phone});
    if(!user) {
        return next(new appError('There is no user with that phone number', 404));
    }

    const otp = user.createPasswordResetToken();

    await user.save({validateBeforeSave: false});

    
    try {
        const otpOptions = {
            from: process.env.TWILIO_FROM,
            to: `whatsapp:+91${req.body.phone}`,
            body: `Your OTP for changing password on Second Serving is: ${otp}`
        }
    
        await sendOtp(otpOptions, res);
        
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email.'
        });
    } catch(err) {

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new appError('There was an error sending the otp.', 500));

    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {

    const user = await User.findOne({
        passwordResetToken: req.body.otp, 
        passwordResetExpires: { $gt: Date.now() }
    });

    if(!user) {
        return next(new appError('OTP is invalid or expired.', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createAndSendToken(user, 200, res);
    
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if(! await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next(new appError('Your current password is wrong', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createAndSendToken(user, 200, res);

});

