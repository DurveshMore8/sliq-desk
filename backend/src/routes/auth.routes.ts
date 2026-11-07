import { Router } from "express";
import { changePassword, login, logout, me, signup } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);

export default router;
