/**
 * [[REQ-296]] — how full a conversation's context was when its last turn ended.
 *
 * THE FIGURE EXISTS AND DOES NOT SURVIVE, which is the whole of the defect this
 * closes. Upstream measures occupancy off the provider's own counters and puts it
 * on the turn's terminal event; `SessionManager` keeps it as a field on the
 * in-memory session and hands it to the next turn's providers as
 * `ctx.occupancyTokens`. On a Worker there is no next turn in that sense: `deps`
 * are rebuilt per request, the manager cache is keyed by the store's object
 * identity, and the session is resumed from the archive — so the field is zero on
 * every turn, the gauge renders nothing, and a guard reading it would never fire.
 * Every part of REQ-169 works; nothing on this host can see it.
 *
 * SO THE HOST KEEPS IT, in the one place that is both durable and already being
 * read every turn: a field on the session's own `chat` ticket, beside
 * `pending_turn` ([[BUG-121]]) and `kb_cursor` ([[REQ-160]]), whose shape this
 * follows deliberately.
 *
 * WHY THIS IS NOT THE THING `0019_turn_spend.sql` RULED OUT. That migration
 * rejects the chat ticket as a home for SPEND, because spend will be billed from
 * and *"the ledger is the engagement's record — what was decided and why — and
 * spend is not part of the engagement"*. Both halves of that argument are about
 * the ledger surface and about money. This is neither: it is one integer of
 * working state about the conversation's own context, unbilled, superseded every
 * turn, and read by the same turn-start lookup the pending record and the corpus
 * cursor already pay for. The four counters still go to `turn_spend`, retained
 * and priced, exactly as they did.
 *
 * ONE FIELD, NOT FOUR. What the gauge and the guard both want is what the LAST
 * REQUEST carried, which is upstream's `turnOccupancy` fold — the last record,
 * never the sum, because each request in a turn replays everything the one before
 * it did. Storing the counters would mean re-deriving that here and getting the
 * fold wrong once.
 */
import { findChat } from './session-delta'
import type { Ticket, TicketStore } from './tickets'
import type { SessionOccupancy } from '../../../tools/generate/src/cli/ai/host-core'

/** The `chat` ticket field the figure lives in. */
export const OCCUPANCY_FIELD = 'occupancy_tokens'

/**
 * What this conversation's last measured request carried, or `0`.
 *
 * ZERO IS "NOT MEASURED", NEVER "EMPTY" — upstream's rule for the same figure,
 * and the reason every reader of it has to say nothing rather than render a gauge
 * at zero: a gauge reading zero is a gauge saying there is room. A corrupt or
 * negative value reads as absent for `storedPending`'s reason: this is a safety
 * net, and a net that fails the turn it protects is worse than no net.
 */
export function storedOccupancy(chat: Ticket | null): number {
  const raw = (chat?.fields ?? {})[OCCUPANCY_FIELD]
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.trunc(value)
}

/**
 * The port `host-core.ts` reaches this through.
 *
 * NO `expected_version`, for `pendingTurns`'s reason: two turns racing to replace
 * one advisory figure both replace it, and refusing a turn to protect a gauge
 * would be the wrong trade. A `fields` patch merges, so the pending record and the
 * cursor beside it are untouched.
 *
 * A MISSING TICKET IS A NO-OP ON WRITE and zero on read, never a create. The
 * archive mints the ticket on the first turn that writes anything and
 * `pendingTurns` creates one ahead of it where it must; a session with neither has
 * nothing to be full of yet.
 */
export function sessionOccupancy(store: TicketStore): SessionOccupancy {
  return {
    read: async (sessionId: string) => storedOccupancy(await findChat(store, sessionId)),
    async write(sessionId: string, tokens: number): Promise<void> {
      if (!Number.isFinite(tokens) || tokens <= 0) return
      const chat = await findChat(store, sessionId)
      if (chat === null) return
      await store.update({
        uid: chat.uid,
        patch: { fields: { [OCCUPANCY_FIELD]: Math.trunc(tokens) } },
      })
    },
  }
}
