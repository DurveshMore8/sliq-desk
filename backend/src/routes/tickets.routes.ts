import { Router } from "express";
import { createComment, listComments } from "../controllers/comments.controller.js";
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
router.get("/:id/comments", listComments);
router.post("/:id/comments", createComment);

export default router;
