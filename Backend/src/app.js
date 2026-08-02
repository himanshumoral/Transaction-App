const express = require('express');
const authRouter = require('./routes/auth.routes');
const accountRouter = require('./routes/account.routes');
const cookieParser = require('cookie-parser');
const transactionRouter = require('../src/routes/transaction.routes');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ['http://localhost:3000','https://Transaction-app.onrender.com'],
    credentials: true
}))

app.use(express.static(path.join(__dirname, '../../Frontend')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.use('/api/auth', authRouter);
app.use('/api/account', accountRouter);
app.use('/api/transaction', transactionRouter);

module.exports = app;