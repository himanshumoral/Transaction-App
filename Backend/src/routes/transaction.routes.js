const { Router} = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const tranactionController = require('../contollers/transaction.contoller');

const transactionRouter = Router();

transactionRouter.post('/', authMiddleware.authMiddleware, tranactionController.createTransaction);

transactionRouter.post('/system/initial-funds', authMiddleware.authSystemUserMiddleware, tranactionController.createInitialFundsTransaction);

transactionRouter.get('/history', authMiddleware.authMiddleware, tranactionController.getTransactionHistory);


module.exports = transactionRouter;