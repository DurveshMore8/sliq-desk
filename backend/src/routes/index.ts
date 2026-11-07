import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import membersRoutes from "./members.routes.js";
import ticketsRoutes from "./tickets.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/members", membersRoutes);
router.use("/tickets", ticketsRoutes);

export default router;
