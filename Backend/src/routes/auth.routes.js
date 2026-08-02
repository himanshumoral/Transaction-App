const express = require('express');
const authController = require('../contollers/auth.controlls'); 
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;