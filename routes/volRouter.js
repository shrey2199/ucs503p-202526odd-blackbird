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

router.get('/:id/food', authController.protect, authController.restrictTo('volunteer'), volController.getVolunteerDonations);

router.post('/:id/accept/food/:fid', authController.protect, authController.restrictTo('volunteer'), volController.acceptFoodDelivery);

router.patch('/update-status/:fid', authController.protect, authController.restrictTo('volunteer'), volController.updateFoodStatus);

module.exports = router;
