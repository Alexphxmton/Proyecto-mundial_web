const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, groupController.createGroup);
router.post('/join', authenticateToken, groupController.joinGroup);
router.get('/', authenticateToken, groupController.getUserGroups);
router.get('/:id', authenticateToken, groupController.getGroupDetails);

module.exports = router;
