---
uid: comment-f55f0a3e
id: COMMENT-2900
type: comment
title: Comment on request REQ-240
created_by: xgd
created_at: '2026-09-13T22:10:46.390817+00:00'
updated_at: '2026-09-13T22:31:13.683747+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a4186018
  kind: chat_transcript
---

<!-- xgd-turn id="0584a018-0859-4ac1-ad7e-f8ddd1eb97c9-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:10:19.629754+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0584a018-0859-4ac1-ad7e-f8ddd1eb97c9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:31:13.373510+00:00" -->
#### Claude
I've read the ticket and the surrounding code. The design is determined enough to proceed — let me start the free-coding flow.

Now the event kinds:

Now the migration:

Now the service module:

Now register the migration with the test harness and typecheck:

Now the node-side UAT (registry shape, panel phrasing, no route):

Running. While it goes, let me update the ticket body with the language that motivates the behaviour I added:

Full workers suite passed (92 files, 824 tests). Now the node suite:

Waiting on the full node suite. Meanwhile, the version bump for the commit:

I'll wait for the node suite before committing. Summary of where things stand:

**Implemented** (branch `free-REQ-240`, worktree cut from `xgd-working`):

| File | What |
|---|---|
| `src/builder/acceptances.js` *(new)* | The registry — three types, five keys, no imports (AC1) |
| `src/builder/contact-events.js` | `acceptance.granted` / `.withdrawn` / `.requested` + labels (AC5/§5) |
| `db/migrations/0004_user_acceptances.sql` *(new)* + baseline | The state table: one row per (contact, key), `business_id` derived from the contact, unique index on the pair, and `(business_id, key, granted)` for the newsletter query (AC4/AC5) |
| `src/acceptances.ts` *(new)* | The `acceptance` ticket type + schema, `documentFor` (newest-wins, seed-if-absent), `recordAcceptance` (one write function, no route), `acceptanceOf`/`acceptancesOf`/`contactsWith`, `documentOutstanding` |
| `src/tickets.ts` | Registers the type in the product pack (AC8) |
| `src/people.ts`, `builder/people.js`, `builder.css` | Current state travels with the contact detail; an `Agreements` section above the history |

**Evidence**: 12 workers UATs (real D1 — document bump leaves prior acceptances outstanding with no row rewritten; grant/withdraw/grant as three distinct events; a request key gets no row; `EXPLAIN QUERY PLAN` naming the index; the append-only trigger refusing an edit; two businesses resolving to their own documents; every write called with `{ DB }` alone), 6 registry/node UATs (import-free source, type table, no router import of the write path), 3 mounted-pane UATs.

Full workers suite already green (92 files / 824 tests). One existing guardrail moved: `REQ-190_baseline`'s primary-key enumeration gains the new table's `id`.

The node suite is still running and has surfaced two failures so far (`BUG-79 flip_in_place`, `BUG-67 backend_settings`) — neither touches anything in this change, so I expect they're pre-existing, but I'll confirm against a clean tree rather than assume. Waiting for the run to finish.

Both failures reproduce on clean `xgd-working` — pre-existing, unrelated. Committing:

Done. REQ-240 is at `free_coded`, commit `2272ca7` merged into `xgd-working`, branch cleaned up.

## What was built

**The layer, and no flow.** A definition (a ticket), a state row, an event per transition, and one write function — `recordAcceptance(env, spec)`, which takes a database and a contact id and nothing else. Nothing in this round asks a contact anything; sign-up, the portal and the capture form are their own tickets and this is what they call.

| Piece | Where |
|---|---|
| The registry — three types, five keys, zero imports | `src/builder/acceptances.js` |
| `acceptance.granted` / `.withdrawn` / `.requested` + labels | `src/builder/contact-events.js` |
| `user_acceptances` — one row per (contact, key), `business_id` derived from the contact's own row via `INSERT…SELECT`, unique index on the pair, `(business_id, key, granted)` for the newsletter query | `db/migrations/0004…` + baseline |
| The `acceptance` ticket type, `documentFor` (newest-wins, seed-if-absent), `recordAcceptance`, `contactsWith`, `documentOutstanding` | `src/acceptances.ts` |
| Current state on the contact detail + an `Agreements` section above the history | `people.ts`, `builder/people.js`, `builder.css` |

**Decisions I made rather than asked about**, all now written into §9 of the ticket so reconcile sees them: wording is *required* (a transition nobody can evidence is refused rather than defaulted); a document acceptance and a request are both un-withdrawable, by one rule with two honest messages; a preference may not name a document; documents seed placeholder copy if the business has none; the terms gate keeps `tos_version`/`tos_accepted_at` this round — migrating that writer belongs with the surface that changes, exactly as the capture form's `consent[]` blob does.

## Evidence

21 new UATs: 12 in workerd against real D1 (document bump leaves prior acceptances outstanding with **no row rewritten**; grant→withdraw→grant as three distinct event rows; a request key gets no row and refuses one; `EXPLAIN QUERY PLAN` naming the index and *not* scanning; the append-only trigger refusing an edit; two businesses resolving to their own documents; every write called with `{ DB }` alone), 6 registry/node (import-free *source*, the type table, no router import of the write path), 3 mounted-pane.

Full sweeps: workers **92 files / 824 tests, all green**. Node **469 passed, 2 failed** — `bug32-webui-scope-rebrand` and `BUG-67 backend_settings`, both of which I reproduced on clean `xgd-working`, so they are pre-existing and not from this change. One existing guardrail moved deliberately: `REQ-190_baseline`'s primary-key enumeration gains the new table's opaque `id`, with a note on why the (contact, key) pair is a unique index and not the key.

<!-- xgd-chat-end -->