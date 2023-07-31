import express from "express";
import { changePassword, emailSend, getFollowed, getFollowers, getOthers, getUser , updateUser} from "../controllers/user.js";

const router = express.Router()

router.get("/find/:userId", getUser)
router.put("/", updateUser)
router.post("/email-send", emailSend)
router.post("/change-password", changePassword)
router.get("/follower", getFollowers);
router.get("/followed", getFollowed);
router.get("/others", getOthers);


export default router