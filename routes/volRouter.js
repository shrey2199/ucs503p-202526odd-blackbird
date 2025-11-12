const express = require('express');
const router = express.Router();
const volController = require('../controllers/volController');
const authController = require('../controllers/authController');

router.get('/me', authController.protect, authController.restrictTo('volunteer'), (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// Fixed: Use req.user._id instead of req.params.id
router.get('/food', authController.protect, authController.restrictTo('volunteer'), volController.getVolunteerDonations);

// Get single food donation (public endpoint for viewing before accepting)
router.get('/food/:fid', volController.getFoodDonation);

// Fixed: Removed /:id from route - volunteer ID comes from authenticated user
router.post('/accept/food/:fid', authController.protect, authController.restrictTo('volunteer'), volController.acceptFoodDelivery);

router.patch('/update-status/:fid', authController.protect, authController.restrictTo('volunteer'), volController.updateFoodStatus);

module.exports = router;
