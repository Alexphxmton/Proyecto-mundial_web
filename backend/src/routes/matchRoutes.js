const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { optionalAuthenticateToken } = require('../middlewares/auth');

router.get('/', optionalAuthenticateToken, matchController.getMatches);
router.get('/sedes', matchController.getSedes);
router.get('/fases', matchController.getFases);
router.get('/equipos', matchController.getEquipos);
router.get('/:id', optionalAuthenticateToken, matchController.getMatchDetail);

module.exports = router;
