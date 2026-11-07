import { Organization } from "./organization.js";
import { Session } from "./session.js";
import { User } from "./user.js";

export { Organization, Session, User };

export async function initModels(): Promise<void> {
  await Promise.all([Organization, User, Session].map((m) => m.init()));
}
