const express = require('express');

const router = express.Router();
const hungerSpotController = require('../controllers/hungerSpotController');

router.get('/', hungerSpotController.getAllHungerSpots);
router.get('/:id', hungerSpotController.getHungerSpotById);
router.get('/:id/donations', hungerSpotController.getDonationsByHungerSpot);

module.exports = router;
