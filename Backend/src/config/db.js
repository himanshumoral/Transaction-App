const mongose = require("mongoose");

function connectDB(){
    mongose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch(err => {
        console.log("MongoDB connection failed");
        process.exit(1);
    })
}

module.exports = connectDB;