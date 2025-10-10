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

router.get('/:id/food', donorController.getDonorDonations);

router.post(
  '/donations',
  donorController.createDonation
);

module.exports = router;