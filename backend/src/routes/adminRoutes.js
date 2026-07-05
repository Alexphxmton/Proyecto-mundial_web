const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Todas estas rutas requieren estar autenticado y tener el rol 'ADMIN'
router.post('/matches', authenticateToken, authorizeRoles('ADMIN'), adminController.createMatch);
router.put('/matches/:id', authenticateToken, authorizeRoles('ADMIN'), adminController.updateMatch);
router.post('/sync-today', authenticateToken, authorizeRoles('ADMIN'), adminController.triggerSyncToday);
router.post('/sync-match/:id', authenticateToken, authorizeRoles('ADMIN'), adminController.triggerSyncMatch);

module.exports = router;
