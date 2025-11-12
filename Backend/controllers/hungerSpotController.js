const HungerSpot = require('../models/hungerSpotModel');
const Food = require('../models/foodModel');

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

// GET all donations for a HungerSpot by ID
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
