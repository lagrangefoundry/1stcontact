---
uid: comment-beaf61fd
id: COMMENT-2316
type: comment
title: Comment on bug BUG-65
created_by: xgd
created_at: '2026-09-08T22:08:37.518417+00:00'
updated_at: '2026-09-08T22:25:49.127099+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-99e6d76b
  kind: chat_transcript
---

<!-- xgd-turn id="3b75f9a7-3d4d-48ed-9b5f-1db9e87eae51-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:08:15.370076+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3b75f9a7-3d4d-48ed-9b5f-1db9e87eae51-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T22:25:48.209091+00:00" -->
#### Claude
Now the shared fixture-build helper, extracted from REQ-123 so both suites use one copy.

Now retire the duplicate from REQ-123's suite and point it at the shared helper.

Now the version bump and commit, on the branch.

Now lock, merge back into `xgd-working`, then gate the ticket to `free_coded`.

Done. BUG-65 is implemented, committed, merged into `xgd-working`, and parked at `free_coded`.

## What changed

**`priming.json` — the `purpose` entry.** It no longer names any document. It names **subjects** instead — how a consultation runs and what to ask when, who you're talking to and how to pitch it, what separates work worth paying for from something off the shelf, what the product is for, the page vocabulary, what components will and won't do, how the system stores and publishes. Subjects are what the `km.mechanism` trigger bites on and what retrieval actually matches; an id is not a word. It keeps the obligation the map can't carry (the method is written down, read it before starting) and now points the session at the map for *which* documents exist.

**`priming.json` — the `method` reminder.** It said "the rest of your method is in DOC-33". Same defect one tier down, riding every turn; it now points at the knowledge base. The `about` block gains the rule for future authors.

**`roles.ts`.** The `PURPOSE_ENTRY` docstring argued *for* the enumeration ("IT NAMES DOCUMENTS"); it now argues for subjects and records why the id list drifted.

**KB rebuilt** (`bin/kb-release`): corpus went 4 exported → 8 exported, DOC-17/DOC-31 removed, DOC-46–DOC-51 added; the awareness map is regenerated over 11 documents in 5 territories with 17 validated access points, replacing the 2026-08-31 map that described 4 documents in 2 and mentioned no `REF-*` projection. Gitignored artefacts, so not in the commit.

## Evidence

`tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts` — 8 UATs. Four static (no shipped text names a document by id or title; the purpose keeps the obligation and the subjects; the reminder points without naming) — all four verified failing against the pre-change file. Four end-to-end over a real fixture build: index, chunk and map a corpus, assemble a real consultant priming through the framework's own loader, then demote one document and add another and rebuild. The added one appears, the demoted one goes, and `priming.json` is byte-identical across both.

Two REQ-171 assertions that pinned the enumeration were retired (one deleted with a pointer to its replacement, one retargeted from the id to the pointer). REQ-123's private fixture-build helper moved to `tests/support/kb-fixture.ts` so both suites share one copy rather than two half-tracking ones.

13 suites run green; assembled priming against the real rebuilt KB is 10,343 chars (~21k with the tool manual) against a 60,000 cap, and every `DOC-`/`REF-` in it comes from the map.

## Two things worth flagging

- **Two `DOC-22` references remain in `priming.json`**, both in the `about` comment block, citing the framework's role-configuration *format* spec. That block never reaches a model, so I scoped the invariant to text a session is sent rather than to the whole file, and said so in the test and the ticket. If you want the literal zero-match grep, say so and I'll rephrase those two lines.
- **Commit `70612b3feb`**, version `0.2.138`, story points 3. Ticket is at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->