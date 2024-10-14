import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiRespons.js"

const registerUser = asyncHandler(async (req, res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    //Get User Details
    const {fullName, email, username, password} = req.body;
    console.log(fullName + " " + email + " " + password);
    
    //Validation-Checking
    if(
        [fullName, email, username, password].some(field => field?.trim() === "")
    ){
        throw new ApiError(400, "All Fields Are Required")
    }

    //Check if User Exist
    const existedUser = User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User Already Exist")
    }

    //Check for Avatar and CoverImage
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is Required")
    }
    
    //Upload them to Cloudinary
    const avatar = await uplodeOnCloudinary(avatarLocalPath)
    const coverImage = await uplodeOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is Required")
    }

    //Create User in Database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //Remove Password and Refresh Token Field From Response
    const createdUser = await user.findByID(user._id).select(
        "-password -refreshToken"
    )

    //Check For User Creation
    if(!createdUser){
        throw new ApiError(500, "Registering a User Went Wrong")
    }

    //Return Response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

export {registerUser}