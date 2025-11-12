const Food = require('./../models/foodModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendOtp = require('./../utils/phone');
const User = require('./../models/userModel');

exports.getVolunteerDonations = catchAsync(async (req, res, next) => {
    // Fixed: Use authenticated user's ID instead of params
    const volunteerId = req.user._id;

    // Sort by createdAt in descending order (newest first)
    // Populate assignedHungerSpot to show delivery location
    const foodEntries = await Food.find({ volunteerId: volunteerId })
        .populate('assignedHungerSpot', 'name location contactPerson')
        .sort({ createdAt: -1 });

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

// Get a single food donation by ID (for viewing before accepting)
exports.getFoodDonation = catchAsync(async (req, res, next) => {
    const foodId = req.params.fid;

    const food = await Food.findById(foodId)
        .populate('donorId', 'fullName organizationType phoneNumber')
        .populate('assignedHungerSpot', 'name location contactPerson');

    if (!food) {
        return next(new appError('Food donation not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            donation: food
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
    // This function already uses req.user._id correctly, no changes needed
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
            const receiverName = food.assignedHungerSpot.contactPerson.name || 'Contact Person';
            await sendOtp({
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${food.assignedHungerSpot.contactPerson.phone}`,
                body: `*${receiverName}*, Volunteer assigned: ${req.user.fullName} (${req.user.phoneNumber})`
            }, res);
        }

        // To Donor
        if (food.donorId?.phoneNumber) {
            const receiverName = food.donorId.fullName || 'Donor';
            await sendOtp({
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${food.donorId.phoneNumber}`,
                body: `*${receiverName}*, Your donation was accepted by ${req.user.fullName} (${req.user.phoneNumber})`
            }, res);
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

