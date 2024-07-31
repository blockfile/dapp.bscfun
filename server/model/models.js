const mongoose = require("mongoose");

// Define the schema
// Update your Mongoose model to include necessary fields
const sphereSchema = new mongoose.Schema({
    tokenName: String,
    contractAddress: {
        type: String,
        set: (v) => v, // This is a no-op, just emphasizing that you're not changing the value
    },
    amountLocked: String,
    lockDuration: {
        minutes: String,
        days: String,
        months: String,
    },
    date: Date,
    status: String,
    unlockedDate: Date,
    accountLocker: String,
    trans_token: String,
    lockIndex: Number,
    tokenSymbol: String,
    points: Number,
});
const Sphere = mongoose.model("sphereDB", sphereSchema);

// New endpoint to handle token lock data

module.exports = Sphere;
