---
uid: comment-08a450b2
id: COMMENT-2905
type: comment
title: Comment on request REQ-235
created_by: xgd
created_at: '2026-09-13T22:13:55.048664+00:00'
updated_at: '2026-09-14T03:57:21.298681+00:00'
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

<!-- xgd-turn id="938b1885-43c2-46a2-b4c8-4f7cddddec55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:39:19.727471+00:00" -->
#### Claude
Read it — `epic-e39c3b32`, "Logging: shared record contract vs per-project transport", 417 lines, revision 2 after BUG-87. It was written 2026-09-12, one day *before* REQ-235, and REQ-235 doesn't cite it anywhere. They collide on the part of REQ-235 that isn't built.

## Where they agree

EPIC-1 §7 explicitly puts the business-event lane **out of scope** and names `contact_events` / `site_changes` / `ticket_changes` / `ledger.ts` as already built — then adds that it is *a metrics source*, because anything contact-shaped is already a `SELECT … GROUP BY` per tenant. REQ-235 §4 (the session rollup row) sits squarely in that lane. No conflict; REQ-235 §4 is the kind of thing EPIC-1 assumed would keep happening.

EPIC-1 §5 and §9 both make retention a first-class routing decision. REQ-235 §2's "retention limit from the first commit, with a pruned-through floor and a `reset`" is a *better* answer than EPIC-1 has anywhere, and should flow back.

## Where they collide

**1. EPIC-1 already answered REQ-235 §2's question, and with a mechanism REQ-235 never mentions.** REQ-235 frames the raw layer as a store choice (Analytics Engine vs D1, "decided in this ticket"). EPIC-1 §8.2 verified against `@cloudflare/workers-types` that a **Tail Worker** (`tail_consumers`) receives a `TraceItem` per invocation carrying `request.method/url/headers/cf`, `response.status`, `outcome`, `cpuTime`, `wallTime`, `logs[]` with severity, and `exceptions[]` — for *every* invocation including ones that threw, at zero call-site cost, covering `scheduled`, queues, email and JS-RPC. EPIC-1 calls this "the access log" and says it needs no change to the existing call sites. REQ-235 §2 as written sends someone to instrument routes by hand.

**2. Analytics Engine is the wrong store for what REQ-235 needs, by EPIC-1's own finding.** EPIC-1 §8.3 records that AE is *adaptively sampled at volume* and its SQL API is account-scoped. REQ-235 §3 has to reconstruct exact session boundaries and §4 forbids storing a `duration_ms` on the grounds that it would "present a floor as a fact" — sessions inferred from sampled events do precisely that, one layer down. REQ-235's leaning toward AE is contradicted by the evidence in EPIC-1; its stated alternative (a bounded D1 table with the prune floor) is the one that survives.

**3. REQ-235 §2 would invent the record schema EPIC-1 exists to own.** EPIC-1 §12 quotes BUG-87 deferring on purpose: *"a logging abstraction is EPIC-1's job in lagrange-framework, and inventing one here would create something that epic has to adopt or delete."* EPIC-1 §13 then commits to a versioned, machine-readable envelope with reserved `event` / `trace_id` / `tenant_id` / severity plus a two-language conformance corpus. A new raw event store in 1c with its own ad-hoc row shape is exactly the thing BUG-87 declined to create. REQ-235 needs to say which it is doing: consuming EPIC-1's envelope, or going first and obliging EPIC-1 to adopt what it lands.

**4. REQ-235 has no redaction position.** EPIC-1 §2 warns specifically against "tenant PII sitting in a short-retention platform log", and §10 requires redaction before records reach the model, with `redact.ts` already in 1c. A raw store of every server-side request holds URLs, headers and IPs. REQ-235 §6 draws the anonymity boundary at *identification* but says nothing about what the rows carry.

**5. REQ-235 answers one of EPIC-1's open questions.** EPIC-1 Q14.1 asks whether the diagnostic horizon is days or months. REQ-235 implies a third answer for its own layer: the raw events only need to live long enough to close a session — hours — because the durable artifact is the `contact_events` summary. That's a materially cheaper shape than R2-for-months and is worth recording against EPIC-1.

## Minor factual note

REQ-235 §1's "four modules already write structured JSON" undercounts: it's six — `identity.ts`, `sign-in.ts`, `email-webhook.ts`, `lead.ts`, `router.ts` (×3), `index.ts` — about eleven call sites. EPIC-1's figure of 92 `console.*` sites is the whole-repo count including `tools/generate`.

---

Combined with the two stale claims from the last pass (the cron exists; public-site has no `[observability]` at all), REQ-235 §1–§3 needs a real revision. My recommendation: **§2 stops being a store decision and becomes a Tail Worker + bounded D1 table with the prune floor, explicitly deferring the record envelope to EPIC-1**; §3's cron-vs-lazy question reopens as "a new caller of the existing 04:17 cron". §4 and §5 stand as written.

Want me to make those edits to the ticket body, preserving the existing structure?

<!-- xgd-turn id="2e34d6a1-60ac-4af3-b36a-6b8120bc665b-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:57:20.301730+00:00" -->
#### You
ok lots of work done - please review EPIC-1 in lf and it child ticket REQ-157 - please adopt that work.

Also please read the new Chat "Member behavior - privacy"

Then lets talk about where all that leaves us with your scope

<!-- xgd-chat-end -->