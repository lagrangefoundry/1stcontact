---
uid: comment-13cf5c3c
id: COMMENT-2306
type: comment
title: Comment on request REQ-203
created_by: xgd
created_at: '2026-09-06T23:41:24.638984+00:00'
updated_at: '2026-09-06T23:58:00.183189+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-609054e3
  kind: chat_transcript
---

<!-- xgd-turn id="a3469df3-699d-4a84-8880-39f5ad6a9001-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T23:40:57.092750+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a3469df3-699d-4a84-8880-39f5ad6a9001-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T23:58:00.127250+00:00" -->
#### Claude
I've read the ticket and the relevant code. The design is clear enough to proceed — let me note the three decisions I had to make myself, then implement.

Good — everything is in the worktree and the main checkout is untouched. Now the terms hook:

Now the UAT suite:

Now the regression scope — every suite that touches admission, terms, identity, scope or people:

The predicate needs tightening — four of those five failures are legitimate regressions. Let me align `admit`'s condition with the same ownership question `ensureOwnBusiness` asks:

Now version bump and commit:

Done. REQ-203 is at `free_coded` on `xgd-working`.

## What landed

**`admit` stops refusing the state the ticket is about.** It was returning `no_membership` — *"your access to 1st Contact has ended"* — to a contact invited five minutes earlier, with the terms gate (the only thing that could end that state) on the far side of the refusal. It now admits a contact holding nothing when **both** are true: they have not signed up (`tos_accepted_at` null) **and** their account owns no business. The second half is what preserves every refusal that should survive — a withdrawn or lost membership leaves an account that already owns a business, so revocation and the re-invite repair still behave exactly as before. The relaxation opens no route: `guardTerms` runs next and refuses everything but the interstitial and the accept route.

**`onboarding.ts` — a new module, deliberately the hook a real onboarding flow replaces.** `ensureOwnBusiness` composes `provisionBusiness` onto the account the contact already has (no `accounts` row is written — the ticket's falsifier), names the business after their display name or `Unnamed business`, and grants open-ended. Idempotency is `tenants.owner_account_id`, exported as `accountOwnsBusiness` so `admit` and the hook ask literally the same question.

**The accept route provisions before it stamps.** A failed provision leaves them un-accepted, still admitted, and able to retry; stamping first would have made one failed write a permanent lockout with the remedy behind the lock. It only provisions for an admission holding nothing, so an operator re-accepting bumped terms isn't handed a business of their own. From `/terms` itself the accept control goes to the builder root rather than reloading the terms; `SITE_TAB` is already first.

## Judgement calls worth flagging

- **REQ-186 is superseded.** Its UAT asserted *"invited and no more is `no_membership`"* — the exact sentence this ticket overturns. I rewrote that assertion to the half that did not change (the admitted set is empty, so the invite alone still isn't access) and named the supersession in both the test and the ticket body. Four other suites failed on my first predicate; that's what drove the two-condition form above rather than a terms-only check.
- The ticket body now carries sections for all of this, so each UAT is motivated by language in it.

## Verification

12 new UATs; 9 of them fail with the source reverted (the other 3 are regression guards). Full regression scope — 14 suites across identity, terms, scope, businesses, invite, contacts, portal, operator, dev-seed — **160 passed** on the merged tree, `tsc --noEmit` clean.

Two notes: the version claim collided with BUG-62 mid-merge, so the commits are `55b8557b` (the work) plus `bf755999` (re-bump to 0.2.123). And `pnpm -r build` in the main checkout aborts on an unrelated `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` — a pre-existing lockfile/node_modules drift there, not from this change; I typechecked and ran the suites via `./node_modules/.bin/` directly rather than let pnpm purge the tree.

<!-- xgd-chat-end -->