import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uplodeOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        //uplode the file
        const response =  await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file is uploded successfully
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log("this is boy ",error);
        return null
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.error("Error while deleting from Cloudinary: ", error);
        return null;
    }
};

export {uplodeOnCloudinary, deleteFromCloudinary}
