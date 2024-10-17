import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiRespons.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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
    
    //Validation-Checking
    if(
        [fullName, email, username, password].some(field => field?.trim() === "")
    ){
        throw new ApiError(400, "All Fields Are Required")
    }

    //Check if User Exist
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User Already Exist")
    }
    
    //Check for Avatar and CoverImage
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

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
    const createdUser = await User.findById(user._id).select(
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

const loginUser = asyncHandler( async(req, res)=> {
    // req body -> data
    // username or email and validate the username, email and password
    //find the user
    //password check
    //access and referesh token
    //send cookie

    // Take Data from Body
    const {password, username, email} = req.body

    //check for username and email and password present or not
    if(!(username || email)){
        throw new ApiError(400, "Username or email field is required")
    }

    if(!password){
        throw new ApiError(400, "Password field is required")
    }

    //find the user
    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    //check for the user
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //Password Validation
    const isPasswordValid = user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

    //generate refreshtoken and accesstoken
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    //send to cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            {
            user: loggedInUser, refreshToken, accessToken
            },
            "User Logged In Successfully"
        )        
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    // remove the user refreshToken from database
    // remove the cookies

    //remove the refreshToken from the database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: "" }
        },
        {
            new : true
        }
    )

    //remove cookies
    const options = {
        httpOnly: true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new ApiError(401, "UnAuthorized Request")
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = generateAccessAndRefereshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

export {registerUser, loginUser, logoutUser, refreshAccessToken}