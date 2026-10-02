import { Router } from "express";
import userRoutes from "./user.routes.js";
import complaintRoutes from "./complaint.routes.js";

const router = Router();

router.use("/user", userRoutes);
router.use("/complaints", complaintRoutes);

export default router;
