import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import membersRoutes from "./members.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/members", membersRoutes);

export default router;
