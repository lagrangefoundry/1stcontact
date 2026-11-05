---
uid: bug-1a5a9d0b
id: BUG-275
type: bug
title: 'Builds: a build that wrote the site and then ended abnormally (stall, error,
  ceiling) is never followed up — no first-pass record, no review, no hand-over (stall
  itself: BUG-274)'
created_by: EPIC-19
created_at: '2026-10-25T00:52:00.029700+00:00'
updated_at: '2026-10-25T01:24:09.010947+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-aa3ac8d1
  commits:
  - working_sha: ce3b1496190c3129041ec610d2a877a14cf022dc
    reconcile_sha: null
    main_sha: null
  - working_sha: d74fcff162454ee296502c7d0b1e0ec3f7a6bbc4
    reconcile_sha: null
    main_sha: null
  version: 0.2.630
---

## Symptom

First-Draft-Test Dina's Diner (tenant `biz_a403927e506760c2e798c89a263443ff`, site
`site_3f5eb611595bd06502f628de6eabf698`), 2026-10-24/25. The consultant asked for
the first draft and announced a build "About 15 minutes".

At 00:21:23 UTC the host ended the consultant's turn:
`{"status":"aborted","reason":"stalled","stall":{"silentMs":304352,"awaiting":"tool Delegate"}}`.
The builder was **still working**: it made tool calls every 5–20 seconds through
00:21:22, with its last `describe_page` reads at 00:21:14–22.

Because the turn died mid-build, **nothing that should follow a first draft ran**:
- the layout check's findings (hero row heights, logo below minimum, stranded
  words) were never acted on;
- no builder report was received;
- `milestones.first_pass_at` was never set, so the first-draft review
  (REQ-427 `first_pass_complete`) never fell due. **No critic and no cold read
  ran** (BUG-271), and the plan has no `critique` field;
- no first-draft hand-over took place (REQ-444/445).

The operator saw a half-finished draft with no explanation.

## Cause

The host's stall timer (BUG-249's progress deadline, `stall_seconds` 300) counts
only the consultant session's own progress. A builder's activity, in its own
session, does not reach it. So a `Delegate` longer than 5 minutes always reads as
"silent", and the turn is abandoned while the builder is working. This is the
host-side counterpart of lagrange-framework BUG-92 A1a ("a delegate that is working
keeps its caller's turn alive").

Separately, the first-pass milestone and its follow-ups are set only when a
builder session **completes**, so an abandoned build leaves the site written but
the plan unaware of it.

## Scope (narrowed 2026-10-25)

**The stall itself is BUG-274** (EPIC-20, filed first, with the investigation of
why the builder's activity never reaches the stall witness). This ticket does
**not** fix the stall. It covers what BUG-274 doesn't: what happens to a build
that has already written the site when its turn ends abnormally for any reason
(stalled, error, the REQ-436 ceiling, a restart).

## Fix

**A build that wrote the site is never orphaned.** If a turn ends abnormally
after a builder has written pages, the host:
- records the builder session as ended, and sets `first_pass_at` on the first
  one, so the first-draft review (REQ-427 `first_pass_complete`, with BUG-271's
  cold read) falls due;
- starts the one-shot continuation (BUG-249's stall continuation) so the
  consultant picks up: reads what the builder wrote, acts on the layout findings
  already recorded, runs the due review, and hands over (REQ-444/445) or explains
  what is unfinished.

The client always gets a reply (REQ-436's "never leave the client hanging").

## Design (as built, 2026-10-25)

Two ways a build that wrote the site went unrecorded. Both are closed:

1. **The `Delegate` returns, but not `reported`.** The first-pass milestone was
   recorded only for a delegation whose outcome was `reported` and which wrote. A
   builder that wrote pages and then ran out of turns (`exhausted`), failed
   (`failed`) or was stopped also wrote the site. **Any delegation that wrote is a
   builder session that ended**, whatever its outcome (`cadence-core.ts`).
2. **The `Delegate` never returns**, because the consultant's round ended around it
   (stalled, error, aborted by Stop or the REQ-436 ceiling). After any such round
   the host reads the site's change journal from the round's start. If the
   assistant (`actor: ai`) wrote since then and no recorded builder session
   accounts for those writes, the session is recorded as ended. This is the same
   plan write a completed session makes (`builderSessionCompleted`), so
   `first_pass_at` is set on the first, and the first-draft review (REQ-427
   `first_pass_complete`) falls due (`host-core.ts` `followUpBuild` /
   `recordBuild`).

**Follow-up, by cause:**
- **Stalled:** BUG-249's one-shot continuation runs as before. With the milestone
  now set, the continuation round sees the first draft as built (its agenda no
  longer says "no first draft built yet"), and the existing holds apply when it
  ends: layout findings first (REQ-415), then the owed review (REQ-427), then the
  hand-over (REQ-444/445). The client always gets the continuation's reply.
- **Error, Stop or the ceiling:** the milestone only, with no continuation. A
  stopped round is never continued (BUG-235). Carrying on past the ceiling would
  break REQ-436, and its report is the reply. An errored round keeps BUG-249's
  gentle failure notice. In all three cases the review is due on the client's
  next message.

**Design decisions:**
- **No extra continuation for an errored round.** One was built and then
  removed. A consultant round can only fail while its `Delegate` is still open
  in rare cases (the junction, not the model), so no UAT could reach that
  branch, and untested code is not kept.
- **No synthetic host look at a cut-off build.** The host's layout look
  (REQ-415) runs on a `Delegate` result, and a cut-off build has none. The
  continuation cue already tells the consultant to look at what landed before
  redoing anything.

**Out of scope:**
- **An isolate restart mid-build.** No host code survives to run the follow-up.
  The turn ledger's watchdog closes the row (BUG-249), and catching it up on the
  next message would need persisted per-build state. That belongs with BUG-274's
  follow-up.
- **The stall itself.** That is BUG-274.

## Test plan (as built)

`tests/test_UAT_FC_BUG-275_an_interrupted_build_is_followed_up.workers.test.ts`
goes through the Worker's `/api/ai/prompt` route, with the real D1, ticket store,
session machinery and delegation surface. The only double is the model client.
The builder's model call after its write hangs, which stalls the consultant's
round inside `Delegate`.

- `..._a_build_cut_off_by_a_stall_after_writing_sets_the_first_pass_and_is_carried_on`:
  `first_pass_at` is set, and `critique.due.trigger` is `first_pass_complete`. A
  continuation round runs with the stall cue naming `tool Delegate`, and its
  agenda no longer reads "no first draft built yet". The client gets the
  recovering line and the continuation's reply.
- `..._a_build_cut_off_before_it_wrote_anything_sets_no_milestone`: no
  `first_pass_at`, no review due, and BUG-249's continuation runs and replies as
  before.
- `..._a_build_whose_builder_failed_after_writing_sets_the_first_pass`: the
  builder writes and then its model fails, so the delegation comes back `failed`.
  `first_pass_at` is set and the review is due.

Run against the old code, the first and third fail and the second passes.

Regression scope: BUG-249 (×3), BUG-256, BUG-269 (×3), REQ-379 (×2), REQ-409,
REQ-415 (×2), REQ-427, REQ-428, REQ-436, REQ-444, REQ-445, BUG-235. 70 pass.
Two fail identically on clean xgd-working, so they predate this change:
`test_UAT_FC_BUG-249_a_turn_that_stalls_twice_is_recorded_stalled_and_frees_the_session`
(`complete` vs `stalled`) and
`test_UAT_FC_REQ-428_the_plan_entry_carries_the_open_decisions_and_due_lines_the_talker_reads_once`.