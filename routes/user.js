
const express= require("express");

const {Router}=express

const jwt=require("jsonwebtoken");

const {JWT_USER_PASSWORD}= require("../config")

const {userModel,purchaseModel,courseModel} = require("../db")

const userRouter =Router();

const bcrypt = require("bcrypt")

const {z} = require("zod")

const {userAuth} = require("../middleware/userMw");


// function auth(req, res, next) {
//     const token = req.headers.token;

//     const response = jwt.verify(token, JWT_USER_PASSWORD);

//     console.log(response)

//     if (response.id) {
//         req.userId=response.id;
//         req.headers.id = response.id;
//         next();
//     } else {
//         res.status(403).json({
//             message: "Incorrect creds"
//         })
//     }
// }

userRouter.post("/signup",async function(req,res){

    
    const requiredbody = z.object({
        email: z.string().min(3).max(100).email(),
        firstName: z.string().min(3).max(100),
        lastName: z.string().min(3).max(100),
        password: z.string().min(3).max(30)
    })

    // const parsedData = requiredBody.parse(req.body)
    const parsedDataWithSuccess = requiredbody.safeParse(req.body)

    if(!parsedDataWithSuccess.success){
        return res.status(400).json({
            message:"Incorrect format",
            error:parsedDataWithSuccess.error
        })
    }



    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName=req.body.lastName;

    try{
        const hashedPassword = await bcrypt.hash(password,5)

        await userModel.create({
            email,
            password:hashedPassword,
            firstName,
            lastName
        });

        res.json({
            message: "You are signed up"
        })
    }catch(err){
        console.log("Error during signup:", err);
        
        // Check if it's a duplicate key error
        if(err.code === 11000){
            return res.status(400).json({
                message:"User already exists"
            })
        }
        
        // For other errors, return detailed information
        res.status(500).json({
            message:"Error creating user",
            error: err.message
        })
    }
})

userRouter.post("/signin", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const user = await userModel.findOne({
        email: email,
    });

    const passwordMatch =await  bcrypt.compare(password,user.password);



    if (user && passwordMatch ) {
        const token = jwt.sign({
            id: user._id.toString()
        },JWT_USER_PASSWORD)

        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
});



// userRouter.post("/signin",function(req,res){
    
// })


userRouter.get("/purchases",userAuth,async function(req,res){
    const userId = req.userId;

    try {
        // Get all purchases for the user
        const purchases = await purchaseModel.find({
            userId
        });

        // Get unique course IDs to avoid duplicates
        const uniqueCourseIds = [...new Set(purchases.map(purchase => purchase.courseId.toString()))];

        // Fetch full course details for unique courses
        const courses = await courseModel.find({
            _id: { $in: uniqueCourseIds }
        });

        res.json({
            purchases: courses
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({
            message: "Error fetching purchases"
        });
    }
})



module.exports={
    userRouter
}