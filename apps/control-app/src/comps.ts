/**
 * The comp board's host half ([[REQ-378]]) — the reference tickets the plan's
 * comp entries point at.
 *
 * A COMP IS A CAPTURE. Every site on the board was put there by `capture_site`
 * (the consultant's) or by the client's "add a site" (the same capture, run by
 * the route), and is the `reference` ticket that capture was adopted as
 * ([[REQ-166]]). The plan says which captures are on the board; this reads and
 * writes what lives on the captures themselves — the client's likes and
 * dislikes — and projects each one for the panel and the comp viewer: which of
 * its screenshots is the desktop page, which is the phone page, and what motion
 * the capture recorded that a screenshot cannot show.
 */
import type { CompDeps, CompRecord, PlanComp } from '../../../tools/generate/src/cli/ai/plan-core'
import { SCREENSHOT_MEMBER } from '../../../tools/generate/src/store/reference-store'
import type { Ticket, TicketStore } from './tickets'

/** The widths the comp viewer shows: a desktop and a phone ([[REQ-378]]). */
export const DESKTOP_WIDTH = 1280
export const PHONE_WIDTH = 375

/** A comp as the panel and the viewer draw it. */
export interface BoardComp extends PlanComp {
  likes: string[]
  dislikes: string[]
  /** One line on the motion the capture recorded, or null. */
  motion: string | null
  /** The bundle member holding the desktop full-page screenshot, or null. */
  desktop: string | null
  /** The bundle member holding the phone full-page screenshot, or null. */
  phone: string | null
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String).filter((x) => x.trim() !== '') : []

/** The ticket as a comp, or `null` when it is not a capture. */
function recordOf(ticket: Ticket): CompRecord | null {
  const f = (ticket.fields ?? {}) as Record<string, unknown>
  if (ticket.type !== 'reference' || f.kind !== 'capture') return null
  return {
    reference: ticket.uid,
    title: ticket.title ?? String(f.source_url ?? ''),
    url: String(f.source_url ?? ''),
    likes: strings(f.likes),
    dislikes: strings(f.dislikes),
  }
}

async function ticketOrNull(tickets: TicketStore, uid: string): Promise<Ticket | null> {
  try {
    return (await tickets.get({ uid })).ticket
  } catch {
    return null
  }
}

/** The comp board's notes, kept on this business's reference tickets. */
export function compDeps(tickets: TicketStore): CompDeps {
  return {
    async get(reference) {
      const ticket = await ticketOrNull(tickets, reference)
      return ticket ? recordOf(ticket) : null
    },
    async note(reference, notes) {
      const patch: Record<string, unknown> = {}
      if (notes.likes !== undefined) patch.likes = notes.likes
      if (notes.dislikes !== undefined) patch.dislikes = notes.dislikes
      const { ticket } = await tickets.update({ uid: reference, patch: { fields: patch } })
      const record = recordOf(ticket)
      if (!record) throw new Error(`${reference} is not a capture`)
      return record
    },
  }
}

/** `meta.member` off an attachment record, or null. */
function memberOf(attachment: Ticket): string | null {
  const meta = attachment.fields?.meta
  if (typeof meta !== 'object' || meta === null) return null
  const member = (meta as Record<string, unknown>).member
  return typeof member === 'string' && member !== '' ? member : null
}

/**
 * The comp board as the panel draws it: each plan entry with its notes, its two
 * screenshots and its motion line.
 *
 * A COMP WHOSE CAPTURE IS GONE STILL SHOWS, with its notes empty and no picture:
 * the board is the plan's, and quietly dropping an entry would hide that the
 * capture went missing.
 */
export async function compBoard(tickets: TicketStore, comps: PlanComp[]): Promise<BoardComp[]> {
  return Promise.all(
    comps.map(async (comp) => {
      const ticket = await ticketOrNull(tickets, comp.reference)
      const record = ticket ? recordOf(ticket) : null
      const members = ticket
        ? new Set(
            (await tickets.attachments({ uid: ticket.uid })).attachments
              .map(memberOf)
              .filter((m): m is string => m !== null),
          )
        : new Set<string>()
      const shot = (width: number): string | null =>
        members.has(`screenshot-${width}.png`) ? `screenshot-${width}.png` : null
      const motion = ticket ? (ticket.fields as Record<string, unknown>).motion : null
      return {
        ...comp,
        title: record?.title ?? comp.title,
        likes: record?.likes ?? [],
        dislikes: record?.dislikes ?? [],
        motion: typeof motion === 'string' && motion !== '' ? motion : null,
        desktop: shot(DESKTOP_WIDTH) ?? (members.has(SCREENSHOT_MEMBER) ? SCREENSHOT_MEMBER : null),
        phone: shot(PHONE_WIDTH),
      }
    }),
  )
}
