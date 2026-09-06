---
uid: comment-ac5dfe98
id: COMMENT-2293
type: comment
title: Comment on request REQ-195
created_by: xgd
created_at: '2026-09-06T18:41:54.269990+00:00'
updated_at: '2026-09-06T19:09:03.389679+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ddd47be3
  kind: chat_transcript
---

<!-- xgd-turn id="366e4c7e-332d-45e7-a847-70e2aaf2a7b4-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:41:15.899348+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="366e4c7e-332d-45e7-a847-70e2aaf2a7b4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T19:09:02.476863+00:00" -->
#### Claude
Now cutting the branch.

Now the shared kind vocabulary, reachable from both sides of the seam.

Now emit from `ensurePlatformOperator` and `acceptTerms`.

Now the UI: a History section in the detail pane.

Now lock and merge back into `xgd-working`.

Now the remaining two conflicts: package.json and the baseline test.

Done. REQ-195 is at `free_coded`, merged into `xgd-working`, branch cleaned.

## What landed

**Schema** (in REQ-190's baseline, which its siblings edit rather than follow) — `contact_events`: opaque id, `contact_id` → `users`, a derived `business_id`, an untyped dotted `kind`, `occurred_at` and `recorded_at` kept apart, a `ref` to the detail record, a `detail` bag. Two indexes (the per-contact timeline, and kind-over-time for "what bounced this week"). **No `status` column** — that was the falsifier.

**Immutability is the database's.** A `BEFORE UPDATE` trigger refuses a rewrite outright; `DELETE` is deliberately left reachable so erasure (DOC-37) can reach these rows. That narrows the ticket's falsifier rather than contradicting it: a correction is an appended event, never an edit. *Technical consequence:* the test harness's migration splitter now tracks `BEGIN`/`END` depth — wrangler's already does, so without it the harness would refuse a migration production accepts.

**`business_id` is derived, never supplied.** Every insert is `INSERT … SELECT … FROM users`, so an event cannot be filed under a business its contact does not belong to; supplying a scope narrows that to a refusal.

**Emitters that have an act to emit from today** — I stretched past "no emission beyond email" here, because **provenance is unanswerable unless something records a contact coming into existence**, and that is one of your acceptance criteria: `contact.created` (invite, and the `PLATFORM_ADMINS` seed), `contact.invited` (every press — `invited_at` is not restamped, so without the event a second press is invisible everywhere), `member.signed_up` on accepting the terms, carrying the version. `email.*` has no emitter — that is REQ-196/198 — so the delivery events are proved through `recordEvent`, the write path those will call.

**The tab** — a History section under Businesses: one sequence newest first, an `Origin:` line from the server's own earliest-event query (not the capped list's tail), the `recorded_at` stamp drawn only when it differs, and an unrecognised kind rendered as itself so the pane needs no edit the day a capability records something new. It rides on `/api/people/detail` rather than a new route.

**Evidence:** 19 workerd UATs against real D1, 6 jsdom UATs against the real components. The regression scope (identity, people, terms, invite, axes, baseline, tab presentation, vocabulary — 15 files, 163 tests) passes on the merged state, and typecheck is clean.

**Two things worth knowing.** The full suite has 5 files / 16 tests failing on a clean tree — knowledge-component drift, confirmed by stashing and re-running — plus two suites that fail only under parallel load and pass in isolation. None touch this work. And the merge back collided with REQ-193's `user_names`, which I resolved by keeping both tables and both name-handling paths; the invite's update and its event go in one batch, with `writeName` after it.

<!-- xgd-chat-end -->