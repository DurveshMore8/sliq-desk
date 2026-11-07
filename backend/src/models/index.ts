import { Organization } from "./organization.js";
import { Session } from "./session.js";
import { Ticket } from "./ticket.js";
import { User } from "./user.js";

export { Organization, Session, Ticket, User };

export async function initModels(): Promise<void> {
  await Promise.all([Organization, User, Session, Ticket].map((m) => m.init()));
}
