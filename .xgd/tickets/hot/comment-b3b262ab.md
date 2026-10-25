---
uid: comment-b3b262ab
id: COMMENT-3014
type: comment
title: Comment on bug BUG-98
created_by: xgd
created_at: '2026-09-16T01:02:35.991901+00:00'
updated_at: '2026-09-16T01:17:01.455442+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8dfdee7c
  kind: chat_transcript
---

<!-- xgd-turn id="fb296c2d-e311-48f7-8ebb-15bfe4ca1c47-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:02:01.714221+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fb296c2d-e311-48f7-8ebb-15bfe4ca1c47-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:16:59.722080+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

The ticket is thorough. Let me check a couple of remaining details, then start.

Now let me set up the ticket and branch.

Now the implementation. Starting with the message record carrying a set of assets:

Now the core change in `deliverForm`:

Now the loop itself:

Clean. Now let me update the existing REQ-241 test that read the old field name, and run the delivery suites.

Now the new UAT file for BUG-98:

Now writing the BUG-98 UAT file:

Now run the affected test suites:

The tests genuinely catch the bug. Now the broader regression scope:

Now the full regression sweep across the touched area plus static guardrails:

Running the full suite detached so it survives this turn:

While that runs, let me update the ticket body with the implementation notes:

Let me review the final diff of the core change while that runs:

Both failures are pre-existing on the untouched tree. Now version bump and commit:

Now merge back into `xgd-working`:

Done. BUG-98 is at `free_coded`, commit `f211f5f` merged into `xgd-working`.

## What changed

**The rule.** `deliverForm` sent one message per *asset*. It now sends one message per *delivery*, and the template's own `placeholders` decide which a delivery is — copy declaring `{{asset_name}}` is about one artifact and keeps a message each; copy that doesn't name one is about the set and goes once, carrying the one grant that opens all of it. No new setting: the declaration is already the page's statement about its own copy.

**The ledger.** A message record now carries the assets it delivered (`fields.asset` → `fields.assets`, `MessageRecord.asset: string | null` → `assets: string[]`). Without that, a set-style message would remember one of two papers a recipient actually received and offer them the other again on the next form — the same duplicate, a week later. Rows written before are read back as a set of one and are not rewritten.

**Events.** Each artifact in a shared message still leaves its own `asset.sent`, all sharing the message's `ref` — `sent` and `taken` are only comparable while they count the same things.

**Authoring.** `asset_name`'s new consequence is documented on the email-page schema and in the `add_page`/`update_page` tool surface, so an author writing copy for a multi-artifact form is told to leave it out rather than reproducing the duplicate by hand.

## Evidence

`tests/test_UAT_FC_BUG-98_one_message.workers.test.ts` — 7 cases, all passing. Verified they genuinely catch the bug: forcing the old per-asset path back fails 4 of them, including the symptom itself.

Full suite: **4311 passed, 2 failed** — both failures (`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`) reproduce identically on the untouched tree and are unrelated to this change.

Six existing UATs read `message.asset`; those reads were renamed. Their assertions are unchanged in substance — the REQ-241 fixture declares `asset_name`, so its "two records, not one carrying two names" claim still holds and still passes.

<!-- xgd-chat-end -->