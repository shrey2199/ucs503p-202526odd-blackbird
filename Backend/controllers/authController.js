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

// Helper function to normalize phone number
const normalizePhoneNumber = (phone) => {
    if (!phone) return phone;
    // Convert to string and trim
    let normalized = String(phone).trim();
    // Remove all non-digit characters
    normalized = normalized.replace(/\D/g, '');
    // Remove +91 or 91 prefix if present, keep only the 10 digits
    if (normalized.startsWith('91') && normalized.length === 12) {
        normalized = normalized.substring(2);
    }
    // If it starts with 0, remove it
    if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
    }
    // Ensure it's exactly 10 digits
    if (normalized.length > 10) {
        normalized = normalized.slice(-10); // Take last 10 digits
    }
    return normalized;
};

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
    // Normalize phone number before storing
    const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber);
    const originalPhone = req.body.phoneNumber;
    const userType = req.body.userType;
    
    if (!userType || !['donor', 'volunteer'].includes(userType)) {
        return next(new appError('User type is required and must be either donor or volunteer.', 400));
    }
    
    // Check if user already exists with same phoneNumber AND userType (try multiple formats)
    // Use collection.findOne to bypass pre-find hook that filters active: false users
    let existingUser = null;
    const existingPhoneFormats = [
        normalizedPhone,
        originalPhone,
        originalPhone.replace(/[^\d]/g, ''),
        `+91${normalizedPhone}`,
        `91${normalizedPhone}`
    ];
    
    for (const phoneFormat of existingPhoneFormats) {
        const userDoc = await User.collection.findOne({ 
            phoneNumber: phoneFormat,
            userType: userType 
        });
        if (userDoc) {
            existingUser = User.hydrate(userDoc);
            break;
        }
    }
    
    // Normalize and update phone number for storage
    req.body.phoneNumber = normalizedPhone;
    
    if (existingUser && existingUser.isVerified) {
        return next(new appError('User already exists. Please login instead.', 400));
    }
    
    // If unverified user exists with same phoneNumber and userType, update OTP and normalize phone number
    if (existingUser && !existingUser.isVerified) {
        const otp = generateOTP();
        existingUser.otp = otp;
        existingUser.phoneNumber = normalizedPhone; // Update to normalized format
        await existingUser.save({ validateBeforeSave: false });
        
        const receiverName = existingUser.fullName || 'User';
        const otpOptions = {
            from: process.env.TWILIO_FROM,
            to: `whatsapp:+91${normalizedPhone}`, // Use normalized phone number
            body: `*${receiverName}*, Your OTP for signing up on Second Serving is: ${otp}`
        };
        
        await sendOtp(otpOptions, res);
        
        return res.status(200).json({
            status: 'success',
            message: 'OTP Sent! Please verify to complete signup.'
        });
    }

    const otp = generateOTP();
    const newUserBody = {
        ...req.body,
        otp: otp,
        active: false, // Set inactive until verified
        isVerified: false // Explicit (though already default)
    };

    // Debug: Log what we're storing (removed console.log)

    const createdUser = await User.create(newUserBody);
    
    // Debug: Log what was actually stored (removed console.log)

    const receiverName = createdUser.fullName || req.body.fullName || 'User';
    const otpOptions = {
        from: process.env.TWILIO_FROM,
        to: `whatsapp:+91${normalizedPhone}`, // Use normalized phone number
        body: `*${receiverName}*, Your OTP for signing up on Second Serving is: ${otp}`
    }

    await sendOtp(otpOptions, res);

    res.status(200).json({
        status: 'success',
        message: 'OTP Sent! Please verify to complete signup.'
    });

});

exports.resendOtp = catchAsync(async (req, res, next) => {
    const { phone, userType } = req.body;

    if (!phone || !userType) {
        return next(new appError('Phone number and user type are required.', 400));
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Find unverified user with same phoneNumber and userType
    const existingUser = await User.findOne({
        phoneNumber: normalizedPhone,
        userType: userType,
        isVerified: false
    });

    if (!existingUser) {
        return next(new appError('No unverified account found. Please signup first.', 404));
    }

    // Generate new OTP
    const otp = generateOTP();
    existingUser.otp = otp;
    await existingUser.save({ validateBeforeSave: false });

    // Send OTP via WhatsApp
    const receiverName = existingUser.fullName || 'User';
    const otpOptions = {
        from: process.env.TWILIO_FROM,
        to: `whatsapp:+91${normalizedPhone}`,
        body: `*${receiverName}*, Your OTP for signing up on Second Serving is: ${otp}`
    };

    await sendOtp(otpOptions, res);

    res.status(200).json({
        status: 'success',
        message: 'OTP resent! Please check your WhatsApp.'
    });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
    const { phone, otp, userType } = req.body;
    
    if (!phone || !otp) {
        return next(new appError('Phone number and OTP are required.', 400));
    }
    
    if (!userType || !['donor', 'volunteer'].includes(userType)) {
        return next(new appError('User type is required and must be either donor or volunteer.', 400));
    }
    
    // Normalize phone number for consistent lookup
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Try multiple formats to find the user with matching phoneNumber AND userType
    // IMPORTANT: Bypass the pre-find hook that filters active: false users
    // We need to find unverified users who have active: false
    // Use collection.findOne() to bypass Mongoose hooks entirely
    let user = null;
    const phoneFormats = [
        normalizedPhone,
        phone,
        phone.replace(/[^\d]/g, ''),
        `+91${normalizedPhone}`,
        `91${normalizedPhone}`,
        `whatsapp:+91${normalizedPhone}`
    ];
    
    // Try each format using collection.findOne to bypass hooks, also check userType
    for (const phoneFormat of phoneFormats) {
        const userDoc = await User.collection.findOne({ 
            phoneNumber: phoneFormat,
            userType: userType 
        });
        if (userDoc) {
            // Hydrate the document directly to bypass hooks
            user = User.hydrate(userDoc);
            break;
        }
    }
    
    if(!user) {
        // Debug: Log what we're searching for and what exists in DB (removed console.log)
        return next(new appError('User not found. Please signup first.', 404));
    }

    if(user.isVerified) {
        return next(new appError('User already verified. Please login instead.', 400));
    }

    if(!await user.correctOtp(otp.toString(), user.otp)) {
        return next(new appError('Incorrect OTP', 401));
    }

    // Activate user and mark as verified
    user.otp = undefined;
    user.isVerified = true;
    user.active = true; // Activate the user

    await user.save({
        validateBeforeSave: false
    });

    createAndSendToken(user, 201, res);

});

exports.login = catchAsync(async (req, res, next) => {
    const { phoneNumber, password, userType } = req.body;

    // Normalize phone number for consistent lookup
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if(!normalizedPhone || !password) {
        return next(new appError('Pls provide phone and password', 400));
    }
    
    if (!userType || !['donor', 'volunteer'].includes(userType)) {
        return next(new appError('User type is required and must be either donor or volunteer.', 400));
    }

    const user = await User.findOne({
        phoneNumber: normalizedPhone,
        userType: userType
    }).select('+password +active'); 

    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new appError('Incorrect Phone or Password', 401));
    }

    // Check if user is verified
    if (!user.isVerified) {
        return next(new appError('Please verify your account first. Check your phone for OTP.', 403));
    }

    // Check if user is active
    if (!user.active) {
        return next(new appError('Your account is inactive. Please contact support.', 403));
    }

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

    const currentUser = await User.findById(decoded.id).select('+active');
    if(!currentUser) {
        return next(new appError('The user of this token does not exist', 401));
    }

    if(await currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new appError('The password was recently changed. Pls login again.', 401))
    }

    // Check if user is verified
    if (!currentUser.isVerified) {
        return next(new appError('Please verify your account to access this resource.', 403));
    }

    // Check if user is active
    if (!currentUser.active) {
        return next(new appError('Your account is inactive. Please contact support.', 403));
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
        const receiverName = user.fullName || 'User';
        const otpOptions = {
            from: process.env.TWILIO_FROM,
            to: `whatsapp:+91${user.phoneNumber}`,
            body: `*${receiverName}*, Your OTP for changing password on Second Serving is: ${otp}`
        }
    
        await sendOtp(otpOptions, res);
        
        res.status(200).json({
            status: 'success',
            message: 'OTP sent to your WhatsApp number.'
        });
    } catch(err) {

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new appError('There was an error sending the OTP.', 500));

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
        return next(new appError('Your current password is wrong', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createAndSendToken(user, 200, res);

});