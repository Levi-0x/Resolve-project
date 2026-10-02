import { Router } from "express";
import { signup, signin, refreshAccessToken, getProfile, updateProfile, getUsers, deleteUser } from "../controllers/user.controller.js";
import { authenticate, adminsOnly } from "../middleware/auth.middleware.js";

const router = Router();

// open routes — no token exists yet, so no middleware here
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/token/refresh", refreshAccessToken);

// protected routes
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.get("/", authenticate, adminsOnly, getUsers);
router.delete("/:id", authenticate, adminsOnly, deleteUser);

export default router;
