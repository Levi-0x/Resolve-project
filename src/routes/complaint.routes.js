import { Router } from "express";
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getAdminStats,
  getMyStats,
} from "../controllers/complaint.controller.js";
import { authenticate, adminsOnly, usersOnly } from "../middleware/auth.middleware.js";

const router = Router();

// every complaint route requires a logged-in user
router.use(authenticate);

router.get("/stats/admin", adminsOnly, getAdminStats); // admin-dashboard.html stat cards
router.get("/stats/me", getMyStats);                   // user-dashboard.html stat cards

router.get("/", getComplaints);          // residents: own complaints · admins: everyone's
router.post("/", createComplaint);
router.get("/:id", getComplaintById);
router.patch("/:id", usersOnly, updateComplaint);                 // resident edits own pending complaint
router.patch("/:id/status", adminsOnly, updateComplaintStatus);
router.delete("/:id", deleteComplaint);                           // admin: any · resident: own pending

export default router;
