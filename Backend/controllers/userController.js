const appError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
    const newObject = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) {
            newObject[el] = obj[el];
        }
    });
    return newObject;
}

exports.updateMe = catchAsync(async (req, res, next) => {

    if(req.body.password || req.body.passwordConfirm) {
        return next(new appError('This route cannot update passwords. Use /updateMyPassword instead.', 400));
    }

    // Filter allowed fields
    const allowedFields = ['fullName', 'location', 'organizationType'];
    const filteredBody = filterObj(req.body, ...allowedFields);
    
    // If updating location, ensure required fields are present
    if (filteredBody.location) {
        if (!filteredBody.location.coordinates || !Array.isArray(filteredBody.location.coordinates) || filteredBody.location.coordinates.length !== 2) {
            return next(new appError('Location must include coordinates as [longitude, latitude]', 400));
        }
        // Ensure location type is set
        if (!filteredBody.location.type) {
            filteredBody.location.type = 'Point';
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })

});