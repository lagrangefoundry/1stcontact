---
uid: comment-08a450b2
id: COMMENT-2905
type: comment
title: Comment on request REQ-235
created_by: xgd
created_at: '2026-09-13T22:13:55.048664+00:00'
updated_at: '2026-09-13T22:38:14.695625+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-8ef68c26
  kind: chat_transcript
---

<!-- xgd-turn id="e4236fab-7b25-4bad-bf14-afd12c491a46-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:13:21.013836+00:00" -->
#### You
I'm surprised to see this ticket - I thought we had a basic event log can you investigate what is there and what the ticket asks for and tell me how they line up?

<!-- xgd-turn id="e4236fab-7b25-4bad-bf14-afd12c491a46-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:16:38.959762+00:00" -->
#### Claude
You were right — there's a real event log. It's `contact_events`, and REQ-235 builds on it rather than replacing it. But there's a second thing the ticket calls "the raw layer" that genuinely doesn't exist, and the ticket's §1 has two factual errors.

## What actually exists

**1. `contact_events` — the contact event spine (REQ-195). Mature.**
- `db/migrations/0001_baseline.sql:663` — table, plus `contact_events_are_immutable` (`db/migrations/0001_baseline.sql:701`) refusing `UPDATE` at the database.
- Separate `occurred_at` / `recorded_at`; `kind` is an unconstrained dotted string; `detail` is a JSON bag; `business_id` derived via `INSERT … SELECT … FROM users` so an event can't be misfiled.
- `apps/control-app/src/events.ts` — statement-builder write (batchable), `eventsOf` (capped at 100), `provenanceOf`.
- Nine kinds in `apps/control-app/src/builder/contact-events.js`, rendered in the detail pane via `eventLabel`.

**2. Structured JSON lines into Cloudflare's invocation log.** A convention, not a store: `console.warn(JSON.stringify({ event, … }))` in `identity.ts:980`, `sign-in.ts:181/190`, `email-webhook.ts:232/271`, `lead.ts:469/498`, `router.ts` (×4), `index.ts:564`. Queryable in Cloudflare's UI, expires on their schedule, not joinable to a contact row.

**3. Two other append-only logs with exactly the retention shape §2 wants** — `site_changes` (ordinal cursor, window enforced by `DELETE`) and `ticket_changes` + `ticket_change_floor` (seq cursor, prune floor → `reset`). The ticket cites the second as precedent, correctly.

## Where the ticket and reality line up

| Ticket asks for | Status |
|---|---|
| §4 rollup row on the timeline | **Mechanism already free.** Unconstrained `kind`, `occurred_at`/`recorded_at` split, and the immutability trigger are all exactly what §4 needs — the ticket is right that this costs "a constant and a label" |
| §2 raw store for *anonymous* server-side events | **Doesn't exist.** `contact_events.contact_id` is `NOT NULL`, so it genuinely can't hold them |
| §2 retention limit | **Doesn't exist for this**, but the pattern is established twice |
| §3 session inference | **Doesn't exist** |
| §5 builder surface signal | **Doesn't exist.** Only the Contacts-pane 2s poll (`people.ts:1177`) |

## Two things §1 gets wrong

**"There is no periodic job. Neither `wrangler.toml` declares a `[triggers]` block and neither Worker exports `scheduled`."** — false since the day before the ticket was written. `apps/control-app/wrangler.toml:87` has `crons = ["17 4 * * *"]`, repeated at `:436` for production, and `index.ts:562` exports `scheduled` (session purge, REQ-231, commit `475f47248a`, 2026-09-12). This materially changes §3: closing sessions on a cron is now *a new caller of existing machinery*, not the first periodic job in the system — which was the main argument for the lazy-read alternative.

**"`observability` runs at `head_sampling_rate = 1` in both Workers"** — false, and worse than stated. Only `control-app` has an `[observability]` block. `apps/public-site/wrangler.toml` has none at all, so the Worker that actually serves visitors retains no per-invocation logs. Whatever the raw layer becomes, public-site has no interim fallback.

Minor: §1 says all but `form.submitted` and `member.signed_up` are things the business did *to* a contact — `email.received` is inbound too, so it's three of nine, not two.

Want me to correct §1 and re-open §3's cron-vs-lazy question in the body now that the cron exists?

<!-- xgd-turn id="938b1885-43c2-46a2-b4c8-4f7cddddec55-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:38:14.617167+00:00" -->
#### You
Please also read EPIC-1 in lagrange framework

<!-- xgd-chat-end -->