---
uid: comment-882549a5
id: COMMENT-5840
type: comment
title: Comment on request REQ-489
created_by: xgd
created_at: '2026-10-30T00:21:07.534984+00:00'
updated_at: '2026-10-30T17:51:04.834736+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-402f6a0b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "70ee651f-8d1f-4056-af73-578fdba1a667",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-30T00:21:02Z" model="claude-opus-5-5" continued_from="dashboard" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-30T00:21:02Z" -->
#### You
I would like to have a control particularly for beta that bounds the total cost of a business - I think I'd like to put it at $100 for the beta

<!-- xgd-chat role="assistant" ts="2026-10-30T00:21:02Z" -->
#### Claude
Filed as REQ-489 under EPIC-20, building the cap EPIC-20 deferred under Caps — discussed, not built: a lifetime dollar ceiling per business ($100 beta default, configurable, per-business override) over everything the meter attributes to it (consultant turns, delegated builder, review, web search, image and clip media). Checked from a counters running total before a turn or paid media call starts; a running turn finishes, so overshoot is bounded by one turn. At the cap AI work stops but the site, forms and leads do not; the client gets a host message with no price; the operator gets a console flag and an internal event; the consultant sees remaining allowance as a fraction in the per-turn tail. Open: lifetime vs monthly, hard stop vs degrade, warning threshold, whether the platform's own business is exempt.

<!-- xgd-chat role="user" ts="2026-10-30T00:32:02Z" -->
#### You
1. lifetime 2. stop no warning 3. no 4. No but on the Operator Console, I would like an override that lets me change the limit on a per-business basis

<!-- xgd-chat role="assistant" ts="2026-10-30T00:32:02Z" -->
#### Claude
Recorded in REQ-489: lifetime total; hard stop at the cap with no warning beforehand — the consultant-facing allowance gauge is removed, and there is no operator threshold event; the platform's own business is capped like any other; the Operator Console gets a per-business limit override on the selected business's panel, behind ownsPlatformBusiness. Raising a capped business above its total lets it work again on the next check, and clearing the override returns it to the $100 default. Test plan extended to match.

<!-- xgd-turn id="8589314d-1a3c-4d98-865c-3210a846ab58-user" -->

<!-- xgd-chat role="user" ts="2026-10-30T16:56:51.195059+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="8589314d-1a3c-4d98-865c-3210a846ab58-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-30T17:50:59.463741+00:00" -->
#### Claude
Reading the meter (`spend.ts`) and the console code to see where the cap check and the override belong.

Still mapping the code: now reading the router where turns start and media is billed, and the console route.

Now the client side: API calls, config strings, and the section.

Code is in; now writing the workers UAT file for the cap.

All six are red on clean xgd-working too. Batch 2 of the workers suite next.

Fixed the one real regression (input sizing, BUG-70). Running the last node batch.

Ticket body updated (original preserved, "As built" appended). Committing the work on the branch.

The spend limit is built and merged into xgd-working. REQ-489 is at `free_coded` (version 0.2.708, 5 story points), with the ticket body updated to match what was built. It reaches dev only after `bin/deploy --env dev`, and the new migration `0037` has to be applied to each database.

**How it works**
- **Default limit:** `SPEND_CAP_USD = "100"` is set in all three `wrangler.toml` environments. If the variable is missing or unreadable, the limit falls back to $100 rather than no limit.
- **Running total:** a `counters` row per business, `(tenant_id, 'spend_micros')`. It is recalculated from the same function that produces the console's total after every turn close, builder request write and media charge, so the two figures always match. A turn's start check reads one row.
- **At the limit:** a new message gets status 402 and this host message, with no figure or currency: *"I've reached my beta allowance, so I can't take on any more work for now. The GenDev Labs team has been told. Your site, its forms and your leads keep working as before."* A message already running finishes, including its continuation rounds. Image and clip requests are refused before the provider is called.
- **When the limit is reached:** one `spend.cap_reached` record is written to `log_records`, plus a Workers log line. Nothing is shown or recorded below the limit.
- **Operator Console:** a new *Spend limit* section in the selected business's panel, after *Business cost*. It shows the lifetime total, the limit (marked default or set for this business) and a red *Capped* line, with *Set limit* and *Use the default* controls. Capped businesses also get a *Capped* badge in the site list. The overrides live in a new `business_spend_caps` table, written by `GET`/`PUT /api/admin/spend/caps`, which sit behind the same operator check as the other admin routes.

**Two things you should know**
- **Image generation was not being charged to any business before.** Clips were recorded, but images weren't. Each image's estimated cost is now recorded the same way as a clip's, so images count toward the limit. Before this, image cost didn't appear in the console either.
- **On a capped business, automatic continuations get no reply.** These are the turns the app starts by itself, for example after the client skips the comparison board. The panel already treats a refused automatic turn as silence, so the allowance message appears on the client's next typed message.

**Tests**
- The 14 new tests pass: the turn, image, clip and admin-route behaviour in `tests/test_UAT_FC_REQ-489_spend_cap.workers.test.ts`, and the console section and list badge in `tests/test_UAT_FC_REQ-489_console_spend_limit.test.ts`.
- I ran the full workers and node suites.
- **Workers suite:** every failure (REQ-295, REQ-342, REQ-416, REQ-424 and others) also fails on clean xgd-working.
- **Node suite:** my change broke one existing test, BUG-70 (the new limit input wasn't styled), which I fixed. The remaining failures that only appeared in my worktree were builder-origin, font-serving, `bin/dev up` and copy-to-cloud tests, which fail because of where the worktree sits, not because of the change. One REQ-127 chat-panel test fails on clean xgd-working too.

<!-- xgd-chat-end -->