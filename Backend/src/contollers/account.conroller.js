const accountModel = require('../models/account.model');
const bcrypt = require('bcryptjs');

async function findAccount(req, res){
    const user = req.user._id;
    const userAccount = await accountModel.findOne({user});

    if(!userAccount){
        return res.status(200).json({
            hasAccount: false,
            message: 'No Account found'
        })
    }
    return res.status(200).json({
        hasAccount: true,
        message: 'Account are findout',
        Account: userAccount
    })
}

async function createAccount(req, res){
    const PIN = req.body.PIN;
    const user = req.user;
    
    if(!PIN || !/^\d{4}$/.test(PIN)){
    return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }
 
    const existingAccount = await accountModel.findOne({ user: user._id});

    if(existingAccount){
        return res.status(400).json({
            message: 'Already have an account'
        })
    }

    const hashPIN = await bcrypt.hash(PIN, 10);

    const account = await accountModel.create({
        user: user._id,
        PIN: hashPIN
    })

    res.status(201).json({
        account
    })
}

async function getBalance(req, res){
    const user = req.user;
    if(!user){
        return res.status(400).json({
            message: 'User not found'
        })
    }
    const account = await accountModel.findOne({
        user: req.user._id
    })
    if(!account){
        return res.status(400).json({
            message: 'Account not found'
        })
    }
    const balance = await account.getBalance();
    return res.status(200).json({
        balance
    })
}

module.exports = {findAccount, createAccount, getBalance};