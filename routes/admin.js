const express= require("express");

const {Router}=express


const jwt=require("jsonwebtoken");
// bcrypt
const {JWT_ADMIN_PASSWORD} = require("../config")

const {adminModel,courseModel,purchaseModel} = require("../db")



const adminRouter =Router();

const bcrypt = require("bcrypt")

const {z} = require("zod")

const {adminAuth} = require("../middleware/adminMw")

// function auth(req, res, next) {
//     const token = req.headers.token;

//     const response = jwt.verify(token,JWT_ADMIN_SECRET);

//     console.log(response)

//     if (response.id) {
//         req.adminId=response.id;
//         req.headers.id = response.id;
//         next();
//     } else {
//         res.status(403).json({
//             message: "Incorrect creds"
//         })
//     }
// }

adminRouter.post("/signup",async function(req,res){

    
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



    const {email,password,firstName,lastName}=req.body

    try{
        const hashedPassword = await bcrypt.hash(password,5)

        await adminModel.create({
            email,
            password:hashedPassword,
            firstName,
            lastName
        });

        res.json({
            message: "You are signed up"
        })
    }catch(err){
        console.log("Error during admin signup:", err);
        
        // Check if it's a duplicate key error
        if(err.code === 11000){
            return res.status(400).json({
                message:"Admin already exists"
            })
        }
        
        // For other errors, return detailed information
        res.status(500).json({
            message:"Error creating admin",
            error: err.message
        })
    }
})


adminRouter.post("/signin", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const user = await adminModel.findOne({
        email: email,
    });

    const passwordMatch =await  bcrypt.compare(password,user.password);



    if (user && passwordMatch ) {
        const token = jwt.sign({
            id: user._id.toString()
        },JWT_ADMIN_PASSWORD)

        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
});




adminRouter.post("/course",adminAuth,async function(req,res){
    const adminId =req.adminId
    const {title,description,price,imageUrl,creatorId} = req.body;

    const course =  await courseModel.create({
        title,
        description,
        price,
        imageUrl,
        creatorId:adminId // currently which admin loggedin when creating course we are sending their id as creator id
    })

    
    
    res.json({
        message:"Course Created",
        courseId: course._id
    })

})


adminRouter.put("/course",adminAuth,async function(req,res){
    const adminId = req.adminId;

    const {title,description,price,imageUrl,courseId} = req.body;

    const course =  await courseModel.updateOne({
            _id:courseId,
            creatorId:adminId
    },{
            title,
            description,
            price,
            imageUrl,
        })
    // console.log("log this ",course)
    res.json({
        message:"Course Updated",
        courseId: courseId
    })
})

adminRouter.get("/course/bulk",adminAuth,async function(req,res){
    const adminId = req.adminId;

    const courses = await courseModel.find({
        creatorId:adminId
    });

    res.json({
        message:"All courses",
        courses
    })
})

module.exports={
    adminRouter
}