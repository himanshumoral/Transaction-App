const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const accountController = require('../contollers/account.conroller');

const router = express.Router();

router.get('/', authMiddleware.authMiddleware, accountController.findAccount);

router.post('/Create', authMiddleware.authMiddleware, accountController.createAccount);

router.get('/balance', authMiddleware.authMiddleware, accountController.getBalance);

module.exports = router;