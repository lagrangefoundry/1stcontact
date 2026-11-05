---
uid: request-b077e25f
id: REQ-455
type: request
title: 'Provisioning: first-draft test copies history only up to the source''s first-draft
  hand-over'
created_by: EPIC-25
created_at: '2026-10-25T00:24:41.715641+00:00'
updated_at: '2026-10-25T16:55:29.207158+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-4553b54e
  story_points: 5
  priority: medium
  blocked_by:
  - request-a589df82
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7ab616eb
  commits:
  - working_sha: fcba5d406058f89432bfd1e8ba6842b93d155d83
    reconcile_sha: null
    main_sha: null
  - working_sha: a052c30174adb7425261b4bccccc5c98c4b77697
    reconcile_sha: null
    main_sha: null
  version: 0.2.634
---

## What changes

A first-draft test business (REQ-450) currently receives the source's **whole** conversation history. The consultant therefore remembers the source's own first draft and everything after it.

This change **cuts the copied history at the source's first-draft hand-over**, so the test business starts from the conversation as it stood when the first draft was about to be shown. Builds, feedback, refinements and critiques after that point are not carried.

### The cut point
One timestamp per copy, chosen in this order:
1. **The hand-over turn.** In the source's **site chat** `chat_transcript`, the first assistant turn containing a link to the draft view (`#show=draft`). The cut is that turn's timestamp.
   - Match the **link**, not the wording, which has changed over time: "See the first draft" in older sites; "Your first draft is ready: have a look" now (`plan-core.ts:1291`, `config.js:970`).
2. **Otherwise, `milestones.first_pass_at`** from the source plan: when the first builder session that wrote the site completed. Older sites without the hand-over line have it.
3. **Otherwise no cut.** The history is copied whole, as REQ-450 does today.

The popup's completion report says which cut was used and its time ("cut at the first-draft hand-over, 01:24", "cut at the first build", or "full history").

### What is cut at that timestamp
Everything is cut at the same instant, so the records agree with each other.

- **Site chat transcript** (`chat_transcript` comment): the turn containing the hand-over link and every turn after it are dropped. Earlier turns are kept verbatim. That includes turns that ran while the first build was going, such as Dina's catering discussion. The session header is re-addressed as today.
- **Tool transcript** (`tool_transcript` comment): every tool entry stamped at or after the cut is dropped.
- **Standing note** (`fields.frame`, delivered to the consultant every turn): replaced with the note as it stood at the cut. That is the input of the last `set_standing_note` call before the cut, taken from the tool transcript. If there was none, the note is empty. **This is the most important part:** the current note is pure post-draft state (Dina's: "called the draft UGLY… BLOCKED… Next: t5, then Colours & fonts").
- **Engagement ledger** (chat ticket body): entries written after the cut are dropped, where the ledger records when they were written.
- **Plan decisions:** the decisions are restored to how they stood at the cut.
  - **Structured `decisions` field.** Each decision takes its state as of the cut (state, value, answer, client action, log number, comps). The source ticket's change log (`ticket_changes`) records each version's fields and is the record to rewind. Where it has been pruned past the cut, any decision settled after the cut (its `answer.at` or `client.at`) goes back to its seed state.
  - **Decision log** (`## Decision log` in the plan body): the log is append-only and numbered. Entries written after the cut are removed, and entries 1..K are kept, where K is the last log number any kept decision state or `record_decision` call before the cut refers to.
  - Dina: decisions 1–5 were recorded before 01:24:18. Decision 6 (the hearted direction, 03:03) and 7 (catering parked, 03:06) are removed, and `visual_concept` goes back to what it was before it was hearted.
- **Stages re-settle after the rewind,** through the host's own stage rules, on top of REQ-450's reset of "First draft" and later. A discovery stage whose facts no longer hold after the cut (e.g. a direction that was only hearted after the draft) reads as it would have at the time, not as done.

### Unchanged from REQ-450
- The business chat is copied whole.
- Builder and critic chats are still not copied.
- Material and references are copied whole, whenever they were added.

## Why

EPIC-25 accepts that a test business is not a faithful rewind of its source. But a consultant that remembers its own previous draft, the client's verdict on it and its refinement plan isn't producing a first draft. It carries on refining a site that no longer exists. Cutting at the hand-over gives the consultant what it had at the moment it handed over a first draft, which is the moment the test is about.

## Test plan

UATs named `test_UAT_FC_REQ-455_*`, through the REQ-450 first-draft copy route. The source is seeded with a site chat whose transcript, tool transcript, standing-note history, ledger and plan decisions straddle a hand-over turn:
- **Hand-over cut:** no turn at or after the hand-over survives; every earlier turn is byte-identical; no tool entry at or after the cut survives.
- **Standing note:** equals the last note set before the cut; it is empty when none was.
- **Decisions:** a decision settled after the cut is back to its pre-cut state; log entries after the cut are gone and earlier entries are intact; a decision settled before the cut is unchanged.
- **Fallbacks:** a source with no hand-over link cuts at `first_pass_at`; a source with neither copies the full history; the report names which cut was used.
- **Wording:** a transcript using the older "See the first draft" wording and one using the current wording both cut at the link.
- **Source unchanged.**
## What landed

`apps/control-app/src/first-draft-cut.ts` holds the cut. `copyFirstDraftChunk`'s last step (`first-draft.ts`) applies it to the site chat before `writeChats`, and to the source plan before `firstDraftPlan`. The business chat, material and references are unchanged from REQ-450.

### Design decisions made during implementation
- **Reuse, not new parsers.** Transcript turns are read and re-written by the framework's own `Session` (`generated/ai-workers`). Tool-transcript sections come from `workLogCalls` (`ledger-core.ts`) and legacy ledger entries from `ledgerEntries`. Seed decisions come from `seedPlan`. The draft link is built from `showHref('draft')`. Plan versions come from the ticket store's own change-log read, `changes()` (already a component op, now named on the `TicketStore` type with `accessor.changeFloor`). Stages re-settle through `sitePlan().write`, which already runs `settleStages` on every write. The only new helper outside the module is `keepLogEntries` in `plan-core.ts`, beside `logEntries`.
- **Hand-over link.** It is a markdown link to `#show=draft` exactly or with `&…` (`](#show=draft)` / `](#show=draft&page=home)`), in an assistant turn.
- **Transcript cut.** The first turn that is the hand-over, or is stamped at/after the cut, is dropped along with everything after it. The first-build cut uses the stamp half of the rule. Segments wholly before the cut are carried byte for byte; the segment the cut falls in is re-serialized by `Session.toFile` (byte-identical for the kept turns, checked on Dina's real transcript); later segments are dropped. A transcript body that is not a session file has no readable turns, so it is carried as-is, the same way `chat-copy.ts` treats an unparseable header.
- **Tool transcript.** Entries stamped at/after the cut are dropped. An entry with no stamp cannot be dated and is kept.
- **Standing note.** A `set_standing_note` input that the artifact shortened (no longer valid JSON) is skipped, so the note falls back to the previous complete one.
- **Ledger / decision log.** Neither the chat-body ledger nor the plan's `## Decision log` records when an entry was written. Both are therefore cut back to entries 1..K. K is the highest of two numbers: the `entries` count reported by any ledger tool call (`record_decision`, `set_standing_note`, `name_engagement`) before the cut, and the `log` number of any kept decision.
- **Decisions.** The whole `decisions` array is taken from the plan's last version before the cut in the change log. If the log has been pruned past the cut, any decision whose `answer.at`/`client.at` is at or after the cut goes back to its seed entry instead.
- **Stages.** A stage reopened by the re-settle carries the host's own "reopened" stamp.
- **Report.** The cut `{by: 'handover' | 'first_build' | 'none', at?}` is stored on the plan's `first_draft_copy` marker. It is returned as `cut` on the completing slice, and on any re-run of a completed copy. The popup's completion line reads "… its discovery is copied, cut at the first-draft hand-over, HH:MM." / "…, cut at the first build, HH:MM." / "…, full history." in the operator's local time.
- **REQ-450 fixture.** `test_UAT_FC_REQ-450_first_draft_copy` stamped `first_pass_at` at the same instant as the client's answers. It now dates the build an hour later. Otherwise this change's cut would correctly rewind those answers. Its assertions are unchanged.
- **Checked against Dina's dev store:**
  - The cut is at the hand-over, 01:24:18.639Z.
  - The transcript ends after the 2,000-person catering exchange. 94 tool entries are kept; the last is at 01:24:11.
  - The note at the cut has no "UGLY".
  - K is 5, so log entries 1–5 are kept and 6–7 dropped.
  - `visual_concept` is back to `proposed` with its unhearted value (plan v115, 01:24:06).

## UATs
- `tests/test_UAT_FC_REQ-455_first_draft_cut.workers.test.ts` (through `route()` and the REQ-450 copy route, real D1/R2):
  - Hand-over cut, for both the older and the current wording.
  - The standing note at the cut, and empty when none was set.
  - Decisions and log rewound; stages re-settled.
  - Pruned change log falls back to the seed state.
  - Fallback to the first build, and full history when there is neither.
  - The source is unchanged.
- `tests/test_UAT_FC_REQ-455_first_draft_dialog.test.ts` (jsdom popup): the completion line for each of the three cuts.