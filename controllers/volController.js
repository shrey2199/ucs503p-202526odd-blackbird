const Food = require('./../models/foodModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendOtp = require('./../utils/phone');
const User = require('./../models/userModel');

exports.getVolunteerDonations = catchAsync(async (req, res, next) => {
    const volunteerId = req.params.id;

    const foodEntries = await Food.find({ volunteerId: volunteerId })

    if (!foodEntries) {
        return next(new appError('No food entries found for this volunteer', 404));
    }

    res.status(200).json({
        status: 'success',
        results: foodEntries.length,
        data: {
            donations: foodEntries
        }
    });
});

exports.updateFoodStatus = catchAsync(async (req, res, next) => {

    const foodId = req.params.fid;

    const food = await Food.findById(foodId);

    const status = req.body.status;

    food.status = status;
    
    await food.save({
        validateBeforeSave: false
    });

    res.status(200).json({
        status: 'success',
        data: {
            food
        }
    });
});

exports.acceptFoodDelivery = catchAsync(async (req, res, next) => {
    // 1) Verify user exists and is authenticated
    if (!req.user || !req.user._id) {
        return next(new appError('Authentication required', 401));
    }

    // 2) Find the food donation
    const food = await Food.findById(req.params.fid)
        .populate('assignedHungerSpot')
        .populate('donorId');

    if (!food) {
        return next(new appError('Food donation not found', 404));
    }

    // 3) Check if already assigned
    if (food.volunteerId) {
        return next(new appError('Pickup already accepted by another volunteer', 409));
    }

    // 4) Assign current user as volunteer
    food.volunteerId = req.user._id; // Use authenticated user's ID
    food.status = 'volunteer_assigned';
    food.assignmentTime = new Date();

    await food.save({ validateBeforeSave: false });

    // 5) Send notifications (with error handling)
    try {
        // To Hunger Spot
        if (food.assignedHungerSpot?.contactPerson?.phone) {
            await sendOtp({
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${food.assignedHungerSpot.contactPerson.phone}`,
                body: `Volunteer assigned: ${req.user.fullName} (${req.user.phoneNumber})`
            });
        }

        // To Donor
        if (food.donorId?.phoneNumber) {
            await sendOtp({
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${food.donorId.phoneNumber}`,
                body: `Your donation was accepted by ${req.user.fullName} (${req.user.phoneNumber})`
            });
        }
    } catch (err) {
        console.error('Notification failed:', err);
        // Continue even if notifications fail
    }

    res.status(200).json({
        status: 'success',
        data: { food }
    });
});

