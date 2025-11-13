const express = require('express');

const router = express.Router();
const hungerSpotController = require('../controllers/hungerSpotController');

// Public routes
router.get('/', hungerSpotController.getAllHungerSpots);
router.post('/login', hungerSpotController.login);

// Protected routes (require authentication) - MUST come before /:id routes
router.get('/me/donations', hungerSpotController.protect, hungerSpotController.getMyDonations);
router.patch('/me/status', hungerSpotController.protect, hungerSpotController.updateActiveStatus);

// Public routes with parameters (must come after /me routes)
router.get('/:id', hungerSpotController.getHungerSpotById);
router.get('/:id/donations', hungerSpotController.getDonationsByHungerSpot);

module.exports = router;
