import { Router } from "express";
import {
  createTicket,
  getTicket,
  listAssignees,
  listTickets,
  updateTicket,
} from "../controllers/tickets.controller.js";
import { requireAuth, requirePasswordChanged } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requirePasswordChanged);

router.get("/assignees", listAssignees);
router.get("/", listTickets);
router.post("/", createTicket);
router.get("/:id", getTicket);
router.patch("/:id", updateTicket);

export default router;
