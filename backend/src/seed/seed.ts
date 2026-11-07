import type { Types } from "mongoose";
import { config } from "../config.js";
import { hashPassword } from "../lib/password.js";
import { nextSlaDueAt } from "../lib/sla.js";
import {
  STAFF_ROLES,
  type Role,
  type TicketPriority,
  type TicketStatus,
} from "../models/constants.js";
import { Comment, Organization, Session, Ticket, User } from "../models/index.js";

export const SEED_PASSWORD = "Password123!";

const SEED_ORGS = [
  { name: "Acme Corp", slug: "acme" },
  { name: "Globex Inc", slug: "globex" },
] as const;

const SEED_ROLES: Role[] = ["superadmin", "admin", "agent", "employee", "viewer"];

const SEED_NAMES: Record<Role, string> = {
  superadmin: "Sam Owner",
  admin: "Alice Admin",
  agent: "Aaron Agent",
  employee: "Emma Employee",
  viewer: "Victor Viewer",
};

interface TicketSpec {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: Role;
  assignee?: Role;
  overdue?: boolean;
  comments?: { by: Role; body: string }[];
}

const TICKETS: TicketSpec[] = [
  {
    title: "Update office wifi password",
    description: "Rotate the guest wifi password and tell reception.",
    status: "closed",
    priority: "low",
    createdBy: "admin",
    assignee: "admin",
    comments: [{ by: "admin", body: "Password rotated and shared with reception." }],
  },
  {
    title: "VPN access for new hire",
    description: "A new starter needs VPN access before Monday.",
    status: "resolved",
    priority: "high",
    createdBy: "employee",
    assignee: "agent",
    comments: [
      { by: "agent", body: "Access granted. Please confirm it works." },
      { by: "employee", body: "Works, thank you." },
    ],
  },
  {
    title: "Printer on floor 2 is offline",
    description: "It has shown as offline since this morning.",
    status: "in_progress",
    priority: "low",
    createdBy: "employee",
    assignee: "agent",
    comments: [
      { by: "agent", body: "Looking into this now." },
      { by: "employee", body: "Thanks!" },
    ],
  },
  {
    title: "Quarterly access review",
    description: "Collect the list of accounts and permissions for the audit.",
    status: "in_progress",
    priority: "medium",
    createdBy: "superadmin",
    assignee: "admin",
    comments: [{ by: "admin", body: "Collecting the list of accounts." }],
  },
  {
    title: "Cannot reset my password",
    description: "The reset email never arrives.",
    status: "open",
    priority: "medium",
    createdBy: "employee",
  },
  {
    title: "Server disk almost full",
    description: "The file server is at 95% capacity and growing.",
    status: "open",
    priority: "high",
    createdBy: "admin",
    overdue: true,
  },
  {
    title: "Payment gateway returns errors",
    description: "Checkout fails for roughly 30% of customers.",
    status: "open",
    priority: "urgent",
    createdBy: "agent",
  },
];

const emailFor = (role: Role, slug: string) => `${role}@${slug}.test`;

async function seedOrganization(name: string, slug: string, passwordHash: string) {
  const org = await Organization.create({ name });
  const organizationId = org._id;

  const members = {} as Record<Role, { _id: Types.ObjectId }>;
  for (const role of SEED_ROLES) {
    members[role] = await User.create({
      organizationId,
      email: emailFor(role, slug),
      name: SEED_NAMES[role],
      passwordHash,
      role,
    });
  }

  for (const spec of TICKETS) {
    const now = new Date();
    const staffReplied = spec.comments?.some((c) => STAFF_ROLES.includes(c.by)) ?? false;
    const firstResponseAt = staffReplied ? now : null;
    const overdueAt = spec.overdue ? new Date(now.getTime() - 30 * 60_000) : null;

    const ticket = await Ticket.create({
      organizationId,
      title: spec.title,
      description: spec.description,
      status: spec.status,
      priority: spec.priority,
      createdById: members[spec.createdBy]._id,
      assigneeId: spec.assignee ? members[spec.assignee]._id : null,
      firstResponseAt,
      overdueAt,
      slaDueAt: nextSlaDueAt(
        {
          priority: spec.priority,
          status: spec.status,
          firstResponseAt,
          overdueAt,
          slaDueAt: null,
        },
        now,
        config.slaMinutes,
      ),
    });

    for (const c of spec.comments ?? []) {
      await Comment.create({
        organizationId,
        ticketId: ticket._id,
        authorId: members[c.by]._id,
        body: c.body,
      });
    }
  }
}

export async function seedDatabase(): Promise<void> {
  let passwordHash: string | null = null;

  for (const { name, slug } of SEED_ORGS) {
    const emails = SEED_ROLES.map((role) => emailFor(role, slug));
    const existing = await User.countDocuments({ email: { $in: emails } });

    if (existing === emails.length) continue;
    if (existing > 0) {
      console.warn(
        `Seed: skipping "${name}" because some of its demo emails are already in use. ` +
          `Run "npm run seed:reset" to rebuild it.`,
      );
      continue;
    }

    passwordHash ??= await hashPassword(SEED_PASSWORD);
    await seedOrganization(name, slug, passwordHash);
    console.log(`Seeded demo organization "${name}"`);
  }
}

export async function resetSeedData(): Promise<void> {
  const emails = SEED_ORGS.flatMap(({ slug }) => SEED_ROLES.map((role) => emailFor(role, slug)));
  const owners = await User.find({ email: { $in: emails } }).select("organizationId");
  const organizationIds = [...new Set(owners.map((u) => String(u.organizationId)))];

  for (const id of organizationIds) {
    const users = await User.find({ organizationId: id }).select("_id");
    await Promise.all([
      Comment.deleteMany({ organizationId: id }),
      Ticket.deleteMany({ organizationId: id }),
      Session.deleteMany({ userId: { $in: users.map((u) => u._id) } }),
    ]);
    await User.deleteMany({ organizationId: id });
    await Organization.deleteOne({ _id: id });
  }
}
