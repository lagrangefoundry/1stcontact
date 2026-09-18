---
uid: comment-aa8e3770
id: COMMENT-3048
type: comment
title: Comment on epic EPIC-18
created_by: xgd
created_at: '2026-09-18T02:34:28.344861+00:00'
updated_at: '2026-09-18T02:43:51.354257+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-c6e64078
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b2c3c063-5fbd-4295-936e-f89f6b9623cc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="440cabe9-546d-4b27-b12a-ca03d00304a1-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T02:32:58.289063+00:00" -->
#### You
Can you double check that we are not creating a dupe here.

Please read EPIC-1 in ../lagrange-framework, including the chat transcript. I think it was there I had a lengthy discussion about logging - activity and error, roll ups retention, use cases etc.

Please sumarise what you think we need here after reading that.

<!-- xgd-turn id="440cabe9-546d-4b27-b12a-ca03d00304a1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T02:38:05.073395+00:00" -->
#### Claude
I read framework **EPIC-1** (all 8 revisions, ~1,065 lines) and its child **REQ-157**, then checked what's already landed here.

## Verdict: partly a dupe — and the part that is, is *done*

Scoped as "logging for 1st Contact", EPIC-18 would duplicate **EPIC-11** (status `done`) / **REQ-235** (`ready_to_reconcile`, 3 commits, code on disk: `log.ts` 630 lines, `activity.ts` 367). Framework EPIC-1 §15 already caught this exact collision and resolved it:

> *"REQ-235's raw layer **IS** this epic's sink. EPIC-1 owns the record; REQ-235 owns the store and its retention; EPIC-8 and REQ-235 own their own readers."*

So the three-way split is already adjudicated and largely built:

| Owner | What | Status |
|---|---|---|
| framework EPIC-1 / REQ-157 | The record: envelope, `kind`×`level`, bound context, redaction, bounds, `LogSink` seam, `DIMENSIONS` as data | **built** (`@lagrangefoundry/logging`) |
| 1c EPIC-11 / REQ-235 | Raw store in D1, retention band `horizon(kind,level)`, pruned-through floor, console+D1 fanout sink, `readRecords`/`countEvents`, session inference → `contact_events`, `kind=client` surface signal, synthetic marking | **built**, prune on the daily cron, closer on `*/10` |
| 1c EPIC-8 | Monitoring tab — the customer-facing chart surface | draft, no children |

## What is genuinely left — and it's all *diagnostics/observability*, not the activity log

REQ-235 §6 names its own exclusions, and EPIC-1 §27 parks a list in 1c's court. Neither has a ticket:

1. **The access log.** No `tail_consumers` anywhere. EPIC-1 §41.1 and §8.2: a Tail Worker is the only thing that sees invocations that *threw* before any call site could log, plus cron/queue/JS-RPC invocations that aren't `fetch`. Zero call-site cost. The `TraceItem` → access-record mapping is the one place a Cloudflare type is converted, and containing it in one named place is the point.
2. **`public-site` is unobserved.** `apps/public-site/wrangler.toml` has no `[observability]` block at all and no store wiring. The Worker that actually serves visitors retains nothing — which is also the Worker EPIC-8's traffic numbers would have to come from.
3. **The rollup ladder + the R2 archive.** raw → hourly (400d) → daily (forever), upserted on closed buckets. This is what makes "access logs indefinitely, at least in summary form" true. Blocked on the one irreversible decision below.
4. **The per-business debug switch.** The package owns `LevelPolicy` as data; 1c owns where it lives. Today there's only a single `LOG_LEVEL` env var. A Worker has no process to restart, so the level is read per invocation or it can't be changed at all — and EPIC-1 §41.3 requires the override carry an `until` expiry.
5. **The operator/AI query surface.** `readRecords`/`countEvents` exist and are wired to nothing by design. EPIC-1 §10: the AI reading diagnostics is what forces a machine-readable schema and redaction-before-the-model.
6. **38 unconverted `console.*` sites**, explicitly out of REQ-235's scope.
7. **The practice doc** — "when to log, at what level, which fields, what never appears." EPIC-1 §46 says it's still unwritten. Most of it is transcribable from BUG-87 and `identity.ts`.

## The one thing worth deciding before anything is built

**EPIC-1 §43 Q1, still open: does `route`/`event` survive to the daily tier?** §37 is blunt that this is the only irreversible decision in the whole design — rollup destroys the past, so a dimension dropped at the coarsest tier makes that question permanently unanswerable, and it fails *silently* (the chart still renders, with less in it). Everything else on the list is cheap to redo.

## Suggested shape for EPIC-18

Not "logging" — that name is what makes it a dupe. Something like **"Observability: the access log, the rollup ladder, and the diagnostic query surface"**, scoped explicitly as *"the parts EPIC-1 §27 assigns to 1c and REQ-235 §6 declined"*, with EPIC-11/REQ-235 named as the built raw tier it sits on top of rather than replaces.

Want me to write that into EPIC-18 as the body, with a title you can override? I'd keep the boundaries section explicit so the next session can't re-collide with EPIC-11 or EPIC-8.

<!-- xgd-turn id="5c5e6299-3145-4abc-baaa-d49b01540951-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T02:43:51.281443+00:00" -->
#### You
**EPIC-1 §43 Q1, still open: does **`route`**/**`event`** survive to the daily tier?** §37 is blunt that this is the only irreversible decision in the whole design <-- what does it mean?

Not "logging" <-- no it reall is logging - this is the real logging the contact activity log is a user visible record of contact activity that is NOT logging and we decided they are separate and unrelated. What you are doijng is Logging capital L no arguments

<!-- xgd-chat-end -->