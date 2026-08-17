---
uid: comment-c73091bc
id: COMMENT-1123
type: comment
title: Comment on request REQ-145
created_by: xgd
created_at: '2026-08-16T22:21:59.514582+00:00'
updated_at: '2026-08-17T19:50:05.728579+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b474390f
  kind: chat_transcript
---

<!-- xgd-turn id="20af8b3a-7bc6-486e-aa8a-d0038cbc3cac-user" -->

<!-- xgd-chat role="user" ts="2026-08-16T22:21:55.439155+00:00" -->
#### You
Are we ready to code this ticket?

<!-- xgd-turn id="e29a5ce5-600e-493c-968b-4abf42c08011-user" -->

<!-- xgd-chat role="user" ts="2026-08-17T01:50:01.018735+00:00" -->
#### You
Are we ready to code this ticket?

<!-- xgd-turn id="aad5e038-39e7-4e7f-ac11-4005f41d9095-user" -->

<!-- xgd-chat role="user" ts="2026-08-17T02:03:14.907895+00:00" -->
#### You
Are we ready to code this ticket?

<!-- xgd-turn id="4f98d940-39a2-4791-9650-786c1123cea2-user" -->

<!-- xgd-chat role="user" ts="2026-08-17T19:22:31.278847+00:00" -->
#### You
Are we ready to code this ticket?

<!-- xgd-turn id="4f98d940-39a2-4791-9650-786c1123cea2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-17T19:23:28.127706+00:00" -->
#### Claude
No — this one isn't ready, and the ticket says so itself.

**Hard blockers**

| Dependency | Status |
|---|---|
| REQ-143 — Cloudflare SiteStore (D1 + R2) | **draft** — not built |
| REQ-147 — Cloudflare Access on app.1stcontact.io | **draft** — not built |
| REQ-142 — async SiteStore port | free_coded (landed) |
| REQ-144 — build/deploy scripts, `[vars]` fix | free_coded (landed) |
| REQ-141 — workerd test project | ready_to_reconcile (landed) |

REQ-145 §3 phase 3 is "request-time L1 render in workerd, reading through **REQ-143's store**" — and the body carries an explicit gate: *"Do not start this before REQ-143 lands — the design may move under it."* The Worker currently has no way to read a site: `apps/control-app/src/index.ts` is still 57 lines of pure proxy to `BUILDER_ORIGIN`, and the store behind it is filesystem-only. Nothing in phases 2–4 can be validated without REQ-143.

**Two further things unsettled**

1. **§4 open questions are all still open.** Does `1c builder` survive as a local dev origin or does `wrangler dev` replace it (keeping both is exactly the two-code-paths problem CLAUDE.md forbids)? Who serves `published` after this — control-app off disk, or `public-site` from R2? Where does the blanket `no-store` live in the Worker? These are design decisions, not implementation details; answering them mid-code means rewriting.
2. **The `[assets]` binding risk is unverified.** `wrangler.toml:8` records that an assets binding made `unstable_dev` hang. All of phase 1 depends on that binding. If it still hangs, the Worker becomes untestable and phase 1 has no path — that's a spike worth doing *before* committing, and it's cheap: it doesn't depend on REQ-143.

**One structural note.** At 21 story points this exceeds the 20-point free-coding cap, so it should be split into separate tickets before coding regardless — phases 1 and 2/3/4 are the natural seam (phase 1 is build-artifact plumbing with no store dependency; the rest needs REQ-143).

**What I'd do next, in order:** (a) run the `[assets]`/`unstable_dev` spike now — it's unblocked and de-risks phase 1; (b) settle the three §4 questions in this ticket's body; (c) build REQ-143; (d) split REQ-145 and start.

Want me to run the assets-binding spike, or work the open questions into the ticket body first?

<!-- xgd-turn id="486b7688-a5b1-411f-94e0-33f7c6a4ad60-user" -->

<!-- xgd-chat role="user" ts="2026-08-17T19:50:05.579495+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-chat-end -->