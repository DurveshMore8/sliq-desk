import { config } from "../config.js";
import { SLA_PRIORITIES, SLA_STATUSES } from "../models/constants.js";
import { Ticket } from "../models/index.js";
import { EVENTS, emitToOrganization } from "./realtime.js";
import { toTicketDto } from "./ticket-dto.js";

const MAX_PER_TICK = 200;

export async function flagOverdueTickets(now = new Date()): Promise<number> {
  let flagged = 0;

  while (flagged < MAX_PER_TICK) {
    const ticket = await Ticket.findOneAndUpdate(
      {
        slaDueAt: { $lte: now },
        overdueAt: null,
        firstResponseAt: null,
        status: { $in: [...SLA_STATUSES] },
        priority: { $in: [...SLA_PRIORITIES] },
      },
      { $set: { overdueAt: now, slaDueAt: null } },
      { new: true, sort: { slaDueAt: 1 } },
    );
    if (!ticket) break;
    flagged++;

    try {
      const dto = await toTicketDto(ticket);
      emitToOrganization(ticket.organizationId, EVENTS.ticketUpdated, { ticket: dto });
      emitToOrganization(ticket.organizationId, EVENTS.slaOverdue, { ticket: dto });
    } catch (err) {
      console.error(`SLA: ticket ${String(ticket._id)} was flagged but the alert failed`, err);
    }
  }

  if (flagged > 0) console.log(`SLA: flagged ${flagged} ticket(s) as overdue`);
  return flagged;
}

export function startSlaChecker(): () => void {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await flagOverdueTickets();
    } catch (err) {
      console.error("SLA check failed", err);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), config.slaCheckIntervalSeconds * 1000);
  void tick();
  return () => clearInterval(timer);
}
