const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const authController = require('../controllers/authController');

router.use(authController.protect);
router.use(authController.restrictTo('donor'));

router.get('/me', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

router.get('/food', donorController.getDonorDonations);

router.get('/hunger-spots', donorController.getNearestHungerSpots);

router.post(
  '/donations',
  donorController.createDonation
);

router.patch(
  '/donations/:fid/status',
  donorController.updateDonationStatus
);

router.delete(
  '/donations/:fid',
  donorController.cancelDonation
);

module.exports = router;