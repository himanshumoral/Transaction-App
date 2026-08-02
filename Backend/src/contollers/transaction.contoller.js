const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.servies');
const mongoose = require('mongoose');
const userModel = require('../models/user.model')
const bcrypt = require('bcryptjs');

async function createTransaction(req, res){
    // Validate request --

    const {toUser, amount, idempotencyKey, PIN} = req.body;

    if(!toUser || !amount || !idempotencyKey || !PIN){
        return res.status(400).json({
             message: 'All fields are required'
        })
    }
    const toUserId = await userModel.findOne({username: toUser})

    const toUserAccount = await accountModel.findOne({user: toUserId._id})

    const fromUserAccount = await accountModel.findOne({
        user : req.user._id
    }).select('+PIN')
    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message: 'Invalid account details',
            fromUserAccount,
            toUserAccount
        })
    }

    const isPINMatch = await bcrypt.compare(PIN, fromUserAccount.PIN);

    if(!isPINMatch){
        return res.status(400).json({
            message: 'Invalid PIN'
        })
    }

    //validate idempotency key --

    const isTransactionExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionExists){
        if(isTransactionExists.status === 'COMPLETED'){
            return res.status(200).json({
                message: 'Transaction already completed',
                transaction: isTransactionExists
            })
        } else if(isTransactionExists.status === 'PENDING'){
            return res.status(200).json({
                message: 'Transaction is still pending',
                transaction: isTransactionExists
            })
        } else if(isTransactionExists.status === 'FAILED'){
            return res.status(500).json({
                message: 'Transaction failed, please try again',
                transaction: isTransactionExists
            }) 
        } else if(isTransactionExists.status === 'REVERSED'){
            return res.status(500).json({
                message: 'Transaction has been reversed, please try again',
                transaction: isTransactionExists
            })
        }
    }

    //Check account status --

    if(fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE'){
        return res.status(400).json({
            message: 'One or both accounts are not active'
        })
    }

    //Derive sender balance from ledger --

    const balance = await fromUserAccount.getBalance();

    if(balance < amount){
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}, Required balance is ${amount}`
        })
    }

    //Create transaction (PENDING) --
    let transaction;
    try{
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (await transactionModel.create([{
        fromAccount: fromUserAccount._id,
        toAccount: toUserAccount._id,
        amount: amount,
        idempotencyKey: idempotencyKey,
        status: 'PENDING'
    }], {session}))[0];

    const debitLedger = await ledgerModel.create([{
        account: fromUserAccount._id,
        transaction: transaction._id,
        amount: amount,
        type: 'DEBIT'
    }], {session: session})
    
    const creditLedger = await ledgerModel.create([{
        account: toUserAccount._id,
        transaction: transaction._id,
        amount: amount,
        type: 'CREDIT'
    }], {session: session})

    await transactionModel.updateOne({ _id: transaction._id }, { status: 'COMPLETED' }, { session});

    await session.commitTransaction();
    session.endSession();
    } catch(err){
    await emailService.sendTransactionFail(req.user.email, req.user.username, amount, toUser);

    return res.status(400).json({
        message: 'Transaction failed, please try again',
        error: err.message
    })
      }

    // Send email notification to both users --
    
    emailService.sendTransactionEmail(req.user.email, req.user.username, amount, toUser);

    return res.status(201).json({
        message: 'Transaction completed successfully',
        transaction: transaction
    })  
}

async function createInitialFundsTransaction(req, res){
    const {toUser, amount, idempotencyKey} = req.body;
    if(!toUser || !amount || !idempotencyKey){
        return res.status(400).json({
            message: 'All fields are required'
        })
    }
    const toUserId = (await userModel.findOne({username: toUser}))._id;
    const toAccount = (await accountModel.findOne({user: toUserId}))._id;

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })
    if(!toUserAccount){
        return res.status(400).json({
            message: 'Invalid account details'
        })
    }
    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })
    if(!fromUserAccount){
        return res.status(400).json({
            message: 'System user account not found'
        })
    }
    try{
    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = (await transactionModel.create([{
        fromAccount: fromUserAccount._id,
        toAccount: toUserAccount._id,
        amount,
        idempotencyKey,
        status: 'PENDING'
    }], {session}))[0]

    const debitLedger = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: 'DEBIT'
    }],{session: session})

    const creditLedger = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: 'CREDIT'
    }],{session: session})

    await transactionModel.updateOne({ _id: transaction._id }, { status: 'COMPLETED' }, { session});

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message: 'Initial funds transaction completed successfully',
        transaction: transaction
    })
    }catch(error){
        return res.status(400).json({
        message: 'Transaction failed, please try again',
        error: err.message
    })
    }

}

async function getTransactionHistory(req, res){
    const userAccount = await accountModel.findOne({ user: req.user._id });

    if(!userAccount){
        return res.status(400).json({ message: 'Account not found' });
    }

    const transactions = await transactionModel.find({
        $or: [
            { fromAccount: userAccount._id },
            { toAccount: userAccount._id }
        ]
    })
    .populate({ path: 'fromAccount', populate: { path: 'user', select: 'username' } })
    .populate({ path: 'toAccount', populate: { path: 'user', select: 'username' } })
    .sort({ createdAt: -1 });

    const formatted = transactions.map(function (txn) {
        const isSender = txn.fromAccount._id.toString() === userAccount._id.toString();

        return {
            id: txn._id,
            direction: isSender ? 'SENT' : 'RECEIVED',
            amount: txn.amount,
            status: txn.status,
            otherUsername: isSender ? txn.toAccount.user.username : txn.fromAccount.user.username,
            createdAt: txn.createdAt
        };
    });

    return res.status(200).json({ transactions: formatted });
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistory
}