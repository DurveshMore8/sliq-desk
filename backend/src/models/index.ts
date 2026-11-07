import { Comment } from "./comment.js";
import { Organization } from "./organization.js";
import { Session } from "./session.js";
import { Ticket } from "./ticket.js";
import { User } from "./user.js";

export { Comment, Organization, Session, Ticket, User };

export async function initModels(): Promise<void> {
  await Promise.all([Organization, User, Session, Ticket, Comment].map((m) => m.init()));
}
