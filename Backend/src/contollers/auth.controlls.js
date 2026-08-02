const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.servies');
const tokenBlackListModel = require('../models/blackList.model');

async function register(req, res){
    const { username, email, password } = req.body;
    if(!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await UserModel.findOne({
        email
    });
    if(existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const user = await UserModel.create({
        username,
        email,
        password
    });
    const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn: '1h'})
    res.cookie('token', token);
    res.status(201).json({ message: 'User registered successfully', user, token });

    await emailService.sendRegisterationEmail(user.email, user.username);
} 

async function login(req, res){
    const {username, email, password} = req.body;
     const user = await UserModel.findOne({
        $or:[
            {email},
            {username}
        ]
    }).select('+password +systemUser');

    if(!user){
        res.status(400).json({message: 'User not found'});
    }

    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        res.status(400).json({message: 'Invalid credentials'})
    }
    const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
    res.cookie('token', token);
    res.status(200).json({message: 'Login successful', user, token, systemUser: user.systemUser});
}

async function logout(req, res){
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.status(200).json({
            message: 'User logged out successfully'
        })
    }

    res.cookie('token', '')

    await tokenBlackListModel.create({
        token: token
    })

    res.status(200).json({
        message: 'User logged out successfully'
    })
}

module.exports = {register, login, logout};