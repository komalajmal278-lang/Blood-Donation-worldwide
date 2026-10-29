const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Donor = require("../models/Donor");

const router = express.Router();

// DONOR REGISTRATION
router.post("/register", async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            bloodGroup,
            country,
            city
        } = req.body;

        if (
            !fullName ||
            !email ||
            !password ||
            !bloodGroup ||
            !country ||
            !city
        ) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingDonor = await Donor.findOne({
            email: normalizedEmail
        });

        if (existingDonor) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const donor = await Donor.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            bloodGroup,
            country: country.trim(),
            city: city.trim()
        });

        return res.status(201).json({
            message: "Registration successful!",
            donor: {
                id: donor._id,
                fullName: donor.fullName,
                email: donor.email,
                bloodGroup: donor.bloodGroup,
                country: donor.country,
                city: donor.city
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});

// DONOR LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }
const donor = await Donor.findOne({
    email: email.trim().toLowerCase()
}).select("+password");

        if (!donor) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            donor.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Server authentication is not configured."
            });
        }

        const token = jwt.sign(
            {
                id: donor._id.toString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.json({
            message: "Login successful!",
            token,
            donor: {
                id: donor._id,
                fullName: donor.fullName,
                email: donor.email,
                bloodGroup: donor.bloodGroup,
                country: donor.country,
                city: donor.city
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
});

module.exports = router;