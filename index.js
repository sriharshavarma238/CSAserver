const express = require("express");

const cors = require("cors");



const { Router } = express

const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config()


const app = express();

app.use(express.json())
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://csa-client-sigma.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'token', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

const { userRouter } = require("./routes/user.js")
const { courseRouter } = require("./routes/course.js")
const { adminRouter } = require("./routes/admin.js")



app.use("/user", userRouter);
app.use("/course", courseRouter);
app.use("/admin", adminRouter);

// MongoDB connection
let isConnected = false;

async function connectDB() {
    if (isConnected) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URL, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            serverSelectionTimeoutMS: 5000
        });
        isConnected = true;
        console.log("Connected to DB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

// For local development
if (require.main === module) {
    const port = process.env.PORT || 3000;
    connectDB().then(() => {
        app.listen(port, () => {
            console.log("this server is running on", port);
        });
    });
}

// For Vercel serverless
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Export for Vercel
module.exports = app;