import { Router } from "express";
import {
  addMember,
  changeRole,
  listMembers,
  removeMember,
  resendPassword,
} from "../controllers/members.controller.js";
import { requireAuth, requirePasswordChanged, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requirePasswordChanged, requireRole("superadmin", "admin"));

router.get("/", listMembers);
router.post("/", addMember);
router.patch("/:id/role", changeRole);
router.delete("/:id", removeMember);
router.post("/:id/resend-password", resendPassword);

export default router;
