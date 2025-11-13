const HungerSpot = require('../models/hungerSpotModel');
const Food = require('../models/foodModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// GET all HungerSpots (no filters)
exports.getAllHungerSpots = async (req, res) => {
  try {
    const hungerSpots = await HungerSpot.find();

    res.status(200).json({
      status: 'success',
      results: hungerSpots.length,
      data: hungerSpots
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// GET one HungerSpot by ID (basic details only)
exports.getHungerSpotById = async (req, res) => {
  try {
    const hungerSpot = await HungerSpot.findById(req.params.id);

    if (!hungerSpot) {
      return res.status(404).json({
        status: 'fail',
        message: 'HungerSpot not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: hungerSpot
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Sign token for hunger spot
const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Create and send token for hunger spot
const createAndSendToken = (hungerSpot, statusCode, res) => {
    const token = signToken(hungerSpot._id);

    const cookieOptions = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000)),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    hungerSpot.password = undefined;
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            hungerSpot
        }
    });
};

// Login for hunger spot
exports.login = catchAsync(async (req, res, next) => {
    const { hungerSpotId, password } = req.body;

    if(!hungerSpotId || !password) {
        return next(new appError('Please provide hunger spot and password', 400));
    }

    const hungerSpot = await HungerSpot.findById(hungerSpotId).select('+password');

    if (!hungerSpot) {
        return next(new appError('Incorrect hunger spot or password', 401));
    }

    // Check if password exists
    if (!hungerSpot.password) {
        return next(new appError('Password not set for this hunger spot. Please contact administrator.', 401));
    }

    // Check if password is correct
    if (!await hungerSpot.correctPassword(password, hungerSpot.password)) {
        return next(new appError('Incorrect hunger spot or password', 401));
    }

    createAndSendToken(hungerSpot, 200, res);
});

// Protect middleware for hunger spots
exports.protect = catchAsync(async (req, res, next) => {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token) {
        return next(new appError('You are not logged in. Please login for access.', 401));
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if hunger spot still exists
    const currentHungerSpot = await HungerSpot.findById(decoded.id).select('+password');
    if(!currentHungerSpot) {
        return next(new appError('The hunger spot of this token does not exist', 401));
    }

    // Check if password was changed after token was issued
    if(currentHungerSpot.changedPasswordAfter(decoded.iat)) {
        return next(new appError('The password was recently changed. Please login again.', 401));
    }

    req.hungerSpot = currentHungerSpot;
    next();
});

// GET all donations for authenticated hunger spot
exports.getMyDonations = catchAsync(async (req, res, next) => {
    const hungerSpotId = req.hungerSpot._id;

    const donations = await Food.find({ assignedHungerSpot: hungerSpotId })
      .populate('donorId', 'fullName organizationType phoneNumber')
      .populate('volunteerId', 'fullName phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: donations.length,
      data: {
        donations
      }
    });
});

// UPDATE isActive status for authenticated hunger spot
exports.updateActiveStatus = catchAsync(async (req, res, next) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        return next(new appError('isActive must be a boolean value', 400));
    }

    const hungerSpot = await HungerSpot.findByIdAndUpdate(
        req.hungerSpot._id,
        { isActive },
        { new: true, runValidators: true }
    );

    if (!hungerSpot) {
        return next(new appError('Hunger spot not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            hungerSpot
        }
    });
});

// GET all donations for a HungerSpot by ID (public endpoint, no auth required)
exports.getDonationsByHungerSpot = async (req, res) => {
  try {
    const hungerSpotId = req.params.id;

    const donations = await Food.find({ assignedHungerSpot: hungerSpotId })
      .populate('donorId', 'fullName organizationType')
      .populate('volunteerId', 'fullName phoneNumber');

    res.status(200).json({
      status: 'success',
      results: donations.length,
      data: donations
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};
