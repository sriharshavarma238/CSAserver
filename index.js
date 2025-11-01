const express = require("express");
const cors = require("cors");
const { Router } = express;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// MongoDB connection
let isConnected = false;

async function connectDB() {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("Connected to DB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://csa-client-sigma.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// For Vercel serverless - connect to DB before handling any route
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ 
            message: "Database connection failed", 
            error: error.message 
        });
    }
});

// Routes - these must come AFTER the DB connection middleware
const { userRouter } = require("./routes/user.js");
const { courseRouter } = require("./routes/course.js");
const { adminRouter } = require("./routes/admin.js");

app.use("/user", userRouter);
app.use("/course", courseRouter);
app.use("/admin", adminRouter);

// For local development
if (require.main === module) {
    const port = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(port, () => {
            console.log("this server is running on", port);
        });
    });
}

// Export for Vercel
module.exports = app;