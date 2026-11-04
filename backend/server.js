const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection for Vercel and local use
let dbConnection = null;

app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            if (!dbConnection) {
                dbConnection = mongoose.connect(process.env.MONGO_URI);
            }

            await dbConnection;
        }

        next();
    } catch (error) {
        dbConnection = null;
        console.error("MongoDB connection failed:", error.message);

        res.status(500).json({
            message: "Database connection failed."
        });
    }
});

// Donor model
const Donor = require("./models/Donor");

// Home route
app.get("/", (req, res) => {
    res.send("Worldwide Blood Donation Backend is Running!");
});

// Authentication routes
app.use("/api/auth", require("./routes/auth"));

// Donor search route
app.get("/api/donors/search", async (req, res) => {
    try {
        const { bloodGroup, country, city } = req.query;

        if (!bloodGroup || !country || !city) {
            return res.status(400).json({
                message: "Blood group, country and city are required."
            });
        }

        const escapeRegex = (value) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const donors = await Donor.find({
            bloodGroup,
            country: {
                $regex: "^" + escapeRegex(country.trim()) + "$",
                $options: "i"
            },
            city: {
                $regex: "^" + escapeRegex(city.trim()) + "$",
                $options: "i"
            },
            $or: [
                { isAvailable: true },
                { isAvailable: { $exists: false } }
            ]
        })
            .select("fullName bloodGroup country city")
            .limit(50);

        res.json({
            message: donors.length
                ? "Donors found!"
                : "No donors found for these details.",
            count: donors.length,
            donors
        });
    } catch (error) {
        console.error("Donor search error:", error.message);

        res.status(500).json({
            message: "Donor search failed. Please try again."
        });
    }
});

// Export app for Vercel
module.exports = app;

// Run normally on your computer
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}