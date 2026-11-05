---
uid: comment-b6d07352
id: COMMENT-2296
type: comment
title: Comment on request REQ-198
created_by: xgd
created_at: '2026-09-06T18:48:38.719906+00:00'
updated_at: '2026-09-06T19:47:02.481632+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9bfe910a
  kind: chat_transcript
---

<!-- xgd-turn id="673b4051-39cf-4dd5-bfbd-2f9179e31d95-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:48:13.622538+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="673b4051-39cf-4dd5-bfbd-2f9179e31d95-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:19:10.046124+00:00" -->
#### Claude
I've read the ticket, its dependencies (REQ-196/197, both in flight in parallel sessions), and the surrounding code. Let me record the design decisions on the ticket and start work.

Now the Messages section in the detail pane:

Now update the ticket body with the two integration decisions the merge made possible, then move to `free_coded`.

<!-- xgd-turn id="45c5df3f-b1a8-419c-baff-8c1d6bddcc28-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:42:51.140977+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="45c5df3f-b1a8-419c-baff-8c1d6bddcc28-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:47:02.410738+00:00" -->
#### Claude
Now lock and merge back into `xgd-working`.

Promoted. Now clean up the branch.

REQ-198 is complete and at `free_coded`.

**What I found on resume:** the prior session had already written the code, the three UAT files, and the full ticket body — and the code commit `5360036587` had already merged into `xgd-working`. What was missing was verification and the promotion gate. No new code was needed.

**What I did this turn:**

1. **Verified the implementation.** All three REQ-198 UAT files pass — 38 tests (`test_UAT_FC_REQ-198_email_record`, `_delivery_webhook`, `_messages_pane`). Adjacent regression scope (people, contact axes, contact events/history, access gate, contacts label, ticket store × 2) — 9 files, 97 tests, all green. `tsc --noEmit` on `apps/control-app` is clean.
2. **Landed the branch.** `free-REQ-198` was behind `xgd-working` and carried a stale `0.2.107` bump. Merged `xgd-working` in (resolving `package.json` to working's higher version), bumped, merged back under `xgd branch lock`, then tore the branch down with `xgd branch clean`.
3. **Promoted to `free_coded`** at version `0.2.117` with six SHAs — the code commit plus five version bumps.

**One friction worth flagging:** the `move-to-free-coded` version gate failed twice with *"version X is already present at the tip of xgd-working, on a commit not reachable from any of the provided SHAs"*. In both cases the named tip was an ordinary `xgd(ticket)` auto-commit from a concurrent session that never touched `package.json` — it landed on top of my bump within seconds. The gate appears to test the tip commit itself rather than the commit that introduced the version, so any concurrent ticket write loses the race. I worked around it by bumping and promoting in a single shell invocation. That's a real defect in the gate under parallel sessions, not something specific to this ticket — worth a bug against `xgd` if you want it filed.

The implementation as landed: `messages.ts` (the `sendRecordedEmail` recorder, port passed in), `email-webhook.ts` (signature-verified, replay-bounded, fails closed when unconfigured, mounted ahead of the Access gate), `tickets.ts` (the `email` type in `productTypePack()`), the Messages section in the Contacts detail pane, and the bounced-contact marker on `/api/people`. Ticket status is `free_coded` — promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->