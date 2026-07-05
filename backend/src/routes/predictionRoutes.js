const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, predictionController.savePrediction);
router.get('/', authenticateToken, predictionController.getUserPredictions);

module.exports = router;
