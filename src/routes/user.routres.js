import { Router } from "express";
import {
  changeCurentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { varifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(varifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(varifyJWT, changeCurentPassword);
router.route("/current-user").get(varifyJWT, getCurrentUser);
router.route("/update-account").patch(varifyJWT, updateAccountDetails);

//updating the user images
router.route("/avatar").patch(varifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(varifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(varifyJWT, getUserChannelProfile);
router.route("/history").get(varifyJWT, getWatchHistory);

export default router;