const User = require('./../models/userModel');
const Food = require('./../models/foodModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendOtp = require('./../utils/phone');
const HungerSpot = require('./../models/hungerSpotModel');
const getTargetGroupFromAI = require('./../utils/aiTargetGroup');

const url = process.env.URL_BACKEND

exports.getDonorDonations = catchAsync(async (req, res, next) => {
    const donorId = req.params.id;

    const foodEntries = await Food.find({ donorId: donorId });

    if (!foodEntries) {
        return next(new appError('No food entries found for this donor', 404));
    }

    res.status(200).json({
        status: 'success',
        results: foodEntries.length,
        data: {
            donations: foodEntries
        }
    });
});

exports.createDonation = catchAsync(async (req, res, next) => {
    // const images = req.files.map(file => ({
    //     data: file.buffer,
    //     contentType: file.mimeType
    // }));

    const {latitude, longitude} = req.body.pickupLocation.coordinates;

    if(!latitude || !longitude) {
        return next(new appError('Pickup coordinates required.', 404));
    }

    const foodType = req.body.foodDetails.category;
    const foodDesc = req.body.foodDetails.description || '';

    if (!foodType) {
        return next(new appError('Food category is required to match HungerSpot', 400));
    }

    let targetGroup;
    try {
        targetGroup = await getTargetGroupFromAI(foodType, foodDesc);
    } catch (err) {
        targetGroup = ''
    }

    const pickupPoint = {
        type: "Point",
        coordinates: [longitude, latitude]
    };

    const nearestSpot = await HungerSpot.findOne({
        isActive: true,
        categories: targetGroup,
        location: {
            $near: {
                $geometry: pickupPoint,
                $maxDistance: 3000
            }
        }
    });

    const foodData = {
        donorId: req.user._id,
        ...req.body,
        assignedHungerSpot: nearestSpot ? nearestSpot._id : null
    };

    const food = await Food.create(foodData);

    if (food.donorWilling === false) {
        const volunteersNearby = await User.find({
            userType: 'volunteer',
            location: {
            $near: {
                $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
                },
                $maxDistance: 3000
            }
            }
        });

        volunteersNearby.forEach(volunteer => {
            if (volunteer.phoneNumber) {
            const message = {
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${volunteer.phoneNumber}`,
                body: `📢 A donation near your location needs a volunteer!\n\n🍱 Category: ${req.body.foodDetails.category}\n📝 Description: ${req.body.foodDetails.description}\n📍 Location: ${req.body.pickupLocation.address}\n\n👉 Accept the pickup:\n${url}/api/v1/volunteer/${volunteer._id}/food/${food._id}`
            };
            sendOtp(message, res);
            }
        });
    }

    res.status(200).json({
        success: 'true',
        data: {
            food
        }
    });

});