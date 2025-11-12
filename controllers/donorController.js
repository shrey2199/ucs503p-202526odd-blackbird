const User = require('./../models/userModel');
const Food = require('./../models/foodModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendOtp = require('./../utils/phone');
const HungerSpot = require('./../models/hungerSpotModel');
const getTargetGroupFromAI = require('./../utils/aiTargetGroup');

const url = process.env.URL_BACKEND
const frontendUrl = process.env.URL_FRONTEND || 'http://localhost:5173'

exports.getDonorDonations = catchAsync(async (req, res, next) => {
    // Use authenticated user's ID instead of params for security
    const donorId = req.user._id;

    // Sort by createdAt in descending order (newest first)
    // Populate assignedHungerSpot to show delivery location
    const foodEntries = await Food.find({ donorId: donorId })
        .populate('assignedHungerSpot', 'name location contactPerson')
        .sort({ createdAt: -1 });

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

// Get nearest hunger spots for donor selection (when donor is willing to deliver)
exports.getNearestHungerSpots = catchAsync(async (req, res, next) => {
    const {latitude, longitude} = req.query;

    if(!latitude || !longitude) {
        return next(new appError('Pickup coordinates required.', 400));
    }

    const foodType = req.query.foodCategory;
    const foodDesc = req.query.foodDescription || '';

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
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    // Build query: only filter by category if target group is "young"
    const query = {
        isActive: true,
        location: {
            $near: {
                $geometry: pickupPoint
            }
        }
    };

    // Only filter by category if target group is "young"
    if (targetGroup === 'young') {
        query.categories = targetGroup;
    }

    // Get up to 3 nearest hunger spots
    const nearestSpots = await HungerSpot.find(query)
        .limit(3)
        .select('name location contactPerson capacity currentLoad');

    res.status(200).json({
        status: 'success',
        results: nearestSpots.length,
        data: {
            hungerSpots: nearestSpots
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

    // If donor is willing to deliver, they must select a hunger spot
    if (req.body.donorWilling === true) {
        if (!req.body.selectedHungerSpotId) {
            return next(new appError('Please select a hunger spot for delivery', 400));
        }

        // Verify the hunger spot exists and is active
        const selectedSpot = await HungerSpot.findById(req.body.selectedHungerSpotId);
        if (!selectedSpot || !selectedSpot.isActive) {
            return next(new appError('Selected hunger spot is not available', 400));
        }
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

    // Only auto-assign if donor is NOT willing to deliver
    let assignedHungerSpot = null;
    if (req.body.donorWilling === false) {
        // Build query: only filter by category if target group is "young"
        const query = {
            isActive: true,
            location: {
                $near: {
                    $geometry: pickupPoint
                }
            }
        };

        // Only filter by category if target group is "young"
        if (targetGroup === 'young') {
            query.categories = targetGroup;
        }

        const nearestSpot = await HungerSpot.findOne(query);
        assignedHungerSpot = nearestSpot ? nearestSpot._id : null;
    } else {
        // Use the selected hunger spot
        assignedHungerSpot = req.body.selectedHungerSpotId;
    }

    // Convert pickupLocation to GeoJSON format
    const foodData = {
        donorId: req.user._id,
        ...req.body,
        pickupLocation: {
            address: req.body.pickupLocation.address,
            type: "Point",
            coordinates: [longitude, latitude]  // Convert to [longitude, latitude] array
        },
        assignedHungerSpot: assignedHungerSpot
    };

    // Remove selectedHungerSpotId from foodData as it's not part of the schema
    delete foodData.selectedHungerSpotId;

    const food = await Food.create(foodData);

    if (food.donorWilling === false) {
        // Notify volunteers if donor is not willing to deliver
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
            const receiverName = volunteer.fullName || 'Volunteer';
            const message = {
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${volunteer.phoneNumber}`,
                body: `*${receiverName}*, 📢 A donation near your location needs a volunteer!\n\n🍱 Category: ${req.body.foodDetails.category}\n📝 Description: ${req.body.foodDetails.description}\n📍 Location: ${req.body.pickupLocation.address}\n\n👉 Accept the pickup:\n${frontendUrl}/volunteer/accept/${food._id}`,
                actionUrl: `${frontendUrl}/volunteer/accept/${food._id}`,
                buttonText: 'Accept Donation'
            };
            sendOtp(message, res);
            }
        });
    } else {
        // Notify hunger spot POC if donor is willing to deliver
        const hungerSpot = await HungerSpot.findById(assignedHungerSpot);
        if (hungerSpot && hungerSpot.contactPerson && hungerSpot.contactPerson.phone) {
            const donor = req.user;
            const receiverName = hungerSpot.contactPerson.name || 'Contact Person';
            const message = {
                from: process.env.TWILIO_FROM,
                to: `whatsapp:+91${hungerSpot.contactPerson.phone}`,
                body: `*${receiverName}*, 🍽️ Donation Incoming!\n\n👤 Donor: ${donor.fullName}\n📞 Contact: ${donor.phoneNumber}\n\n🍱 Category: ${req.body.foodDetails.category}\n📝 Description: ${req.body.foodDetails.description}\n📦 Quantity: ${req.body.foodDetails.quantity} ${req.body.foodDetails.unit}\n📍 Pickup: ${req.body.pickupLocation.address}\n\n🚗 The donor will deliver directly to your location.`
            };
            sendOtp(message, res);
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            food
        }
    });

});

exports.updateDonationStatus = catchAsync(async (req, res, next) => {
    const foodId = req.params.fid;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'volunteer_assigned', 'in_transit', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
        return next(new appError('Invalid status', 400));
    }

    // Find the food donation
    const food = await Food.findById(foodId);

    if (!food) {
        return next(new appError('Donation not found', 404));
    }

    // Verify the donation belongs to the authenticated donor
    if (food.donorId.toString() !== req.user._id.toString()) {
        return next(new appError('You can only update your own donations', 403));
    }

    // Only allow status updates for donor-willing donations
    if (!food.donorWilling) {
        return next(new appError('Status can only be updated for donations you are delivering', 400));
    }

    // Update status
    food.status = status;
    
    // Update timestamps based on status
    if (status === 'in_transit' && !food.assignmentTime) {
        food.assignmentTime = new Date();
    }
    if (status === 'delivered') {
        food.deliveryTime = new Date();
    }

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

exports.cancelDonation = catchAsync(async (req, res, next) => {
    const foodId = req.params.fid;

    // Find the food donation
    const food = await Food.findById(foodId);

    if (!food) {
        return next(new appError('Donation not found', 404));
    }

    // Verify the donation belongs to the authenticated donor
    if (food.donorId.toString() !== req.user._id.toString()) {
        return next(new appError('You can only cancel your own donations', 403));
    }

    // Only allow cancellation for:
    // 1. Donor-willing donations (any status)
    // 2. Non-donor-willing donations with pending status
    const canCancel = food.donorWilling || (!food.donorWilling && food.status === 'pending');
    
    if (!canCancel) {
        return next(new appError('This donation cannot be cancelled', 400));
    }

    // Check if already assigned to a volunteer (for non-donor-willing)
    if (!food.donorWilling && food.status !== 'pending') {
        return next(new appError('Cannot cancel donation that has been accepted by a volunteer', 400));
    }

    // Update status to cancelled
    food.status = 'cancelled';

    await food.save({
        validateBeforeSave: false
    });

    res.status(200).json({
        status: 'success',
        message: 'Donation cancelled successfully',
        data: {
            food
        }
    });
});