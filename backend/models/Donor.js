const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        bloodGroup: {
            type: String,
            required: true,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        },

        country: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Existing MongoDB "users" collection use hogi
module.exports = mongoose.model("Donor", donorSchema, "users");