---
uid: request-c62cf8fc
id: REQ-458
type: request
title: 'First draft: no unreviewed hand-over — record the first pass from the site''s
  state (covers vanished turns and restarts), hold the first-draft announcement until
  the review has run, and name the build in flight'
created_by: EPIC-19
created_at: '2026-10-25T01:26:14.927790+00:00'
updated_at: '2026-10-25T17:23:37.103608+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-0df113ab
  commits:
  - working_sha: 7a6cb8eb76381e5289d7040bf10234cd2f5f0c4f
    reconcile_sha: null
    main_sha: null
  - working_sha: 04b087a197446619823821cd90d45ee61cb57db7
    reconcile_sha: null
    main_sha: null
  version: 0.2.636
---

## Why

Follow-up to **BUG-275** (landed 2026-10-24 18:21, after the dev snapshot used in
this run). BUG-275 records the first pass after a stalled or errored round, using
the change journal. It explicitly leaves out a turn that vanishes (an isolate
restart mid-build), and it adds no rule that the client must not be handed an
unreviewed first draft. Both happened on First-Draft-Test Dina's Diner
(`site_3f5eb611595bd06502f628de6eabf698`). The operator: "Did the critic run? Can
we ensure that it does going forward?"

**What happened next on the same site** (UTC):
- **01:00:27** "Please complete the first draft": the consultant delegated at
  01:01:15. That turn (`37102bd7`) has **no `turn_end` at all**. Its builder
  appears to have carried on, and is the likely source of the hero alignment fix.
- **01:06:12** "Please complete the first draft" again (`451b93bd`): `Delegate` was
  refused `scope_held` (the earlier builder still held the pages). The consultant
  then:
  - tried `answer_finding C1.1`, a finding from the **old** Dina chat copied into
    the test business (REQ-455 will truncate that history), refused as
    `UNKNOWN_FINDING`;
  - re-set `first_draft in_progress`;
  - **announced "Your first draft is ready"** with REQ-445's directed items.

At that point the plan had **no `first_pass_at` and no `critique`**. The review
never fell due, so the hand-back was never held for it, and the client was handed
an unreviewed draft. The operator: "Did the critic run? Can we ensure that it does
going forward?"

**The weakness:** the review falls due only when the host processes a builder's
completed result inside a live consultant turn. A turn that dies (stall, a vanished
turn as here, a restart) loses that trigger, and nothing else restores it.

## What changes

**The trigger and the hold follow the site, not a builder result.**
- **The first pass is recorded from the site's state.** When the site's draft has
  real content written by builders (pages beyond the starter) and no `first_pass_at`
  exists, the host sets it on the next plan write or consultant turn. The
  first-draft review then falls due, whatever happened to the turns that built it.
- **No first-draft hand-over without a review.** While the first-draft review is
  due or unanswered, the hand-back is held (REQ-427's hold). Presenting the first
  draft to the client (the hand-over steering, `show_client` of the draft as the
  first-draft announcement, or setting First draft toward done) is refused, with a
  reason that says to run the review first. A review run once on the draft as it
  stands satisfies it.
- **Work in flight is visible to the consultant.** When `Delegate` is refused
  `scope_held`, the result names the running builder and the turn it belongs to.
  The consultant does not announce the draft as ready while a build on its pages is
  still running.
- **A turn with no `turn_end`** (like `37102bd7`) is treated like an abandoned turn:
  its builder's eventual result is still recorded, and the follow-up runs.

## Design (as built, 2026-10-25)

**1. The first pass is recorded from the site's state** (`host-core.ts` `firstPassFromSite`).
The check runs at the start of every consultant round and again after it ends,
so the plan entry the consultant reads already has it. The first pass is recorded
when all of these hold:
- the plan has no `first_pass_at`;
- the change journal holds an assistant (`actor: ai`) write to a page, or the
  journal window is truncated;
- the site holds more than the untouched starter page (`nothingBuilt`, BUG-215);
- **no builder still holds a page lease.** While a build is running, its own
  result records it. A builder whose turn vanished is caught once its lease is
  released or expires (REQ-397 idle expiry).

It records through the same path a finished builder session uses (`recordBuild`
→ `builderSessionCompleted`). That sets `first_pass_at`, and the
`first_pass_complete` checks and review fall due. This covers a turn with no
`turn_end`, an isolate restart, and a builder whose result never reached the host.

**2. No first-draft hand-over without a review** (`plan-core.ts`, only where the
host runs a critic). This applies while the first draft is built, the client has
not yet had it (`draftUnreviewed`), and `critiqueOwed` is non-empty
(`firstDraftReviewOwed`). In that state:
- **`show_client` with `target: draft`** (link or switch, any page) is refused as
  `DRAFT_NOT_REVIEWED`. The reason names the owed review and says to call
  critique, answer each finding, and not tell the client the draft is ready until
  then.
- **The hand-over steering is withheld.** The plan entry's "Due first" line
  becomes `DRAFT_REVIEW_FIRST_LINE` ("call critique and answer each finding before
  you show it to the client or tell them it is ready"). REQ-445's
  `FIRST_DRAFT_LEAD` ("Your first draft is ready: …") is left out until the
  review is done.
- Once the review has run and every finding is answered, both come back, and REQ-427's
  hand-back hold already applies at the round's end.
- **Setting First draft to done** was already impossible before the client has
  seen and answered the draft (BUG-269 `draft_reviewed`, `TICKS_ITSELF`), and
  that can only follow the hand-over. No new rule was needed.

**3. Work in flight is visible to the consultant.**
- **`scope_held` names the build** (`lease-core.ts` `scopeHeld`). It gives the
  holding builder (`builder worker-…`, since when), the consultant turn that
  started it (`started by consultant turn …`, from an in-process map filled by
  the claim hook, `claimNamingTurn`), and the instruction "do not tell the client
  the draft or its pages are ready until it has finished".
- **`show_client` of the draft is refused as `DRAFT_BUILDING`** while a builder
  holds a page lease (`show-core.ts` `ShowDeps.building`, host `draftBuilding`).
  With `page` given, only that page's files count; without it, any page counts.
  The reason names each builder, its turn, the file and since when, and says to
  tell the client it is still being built. This applies only until the client
  has had the first draft (`draftReviewed`), so later rounds with parallel builders
  (REQ-411) are unchanged. It reads the leases, so it works across isolates. The
  turn is named only in the isolate that started the build.
- Both new codes are declared on `show_client` in `plan-surface.json`.

**Design decisions:**
- **No per-plan-write trigger.** "On the next plan write or consultant turn"
  became consultant round start and end. Every hold and refusal is read inside a
  consultant round, so a check there is enough. Reading pages and the journal on
  every plan write would cost more and gain nothing.
- **The journal decides "written by the assistant", not page contents.** Sites
  imported or seeded with content (and every test fixture) are not the
  assistant's first draft, and must not fall due for one.
- **No first pass while a builder is still running.** Recording it then would
  make the review run on a half-built draft.

## Test plan (as built)

`tests/test_UAT_FC_REQ-458_no_unreviewed_first_draft.workers.test.ts` goes
through the Worker's `/api/ai/prompt` route, with real D1, the ticket store,
sessions, and the plan and delegation surfaces. The doubles are the model client
and, for the critic, the browser.
- `..._pages_written_by_a_builder_whose_turn_vanished_record_the_first_pass_on_the_next_turn`:
  an assistant `set_l1` on the draft with nothing recorded on the plan (a vanished
  turn). On the next message, `first_pass_at` is set and the review runs as
  `first_pass_complete`. The consultant's first request already carries "A review
  of the site is due (the first draft is built)" and `DRAFT_REVIEW_FIRST_LINE`,
  and not `FIRST_DRAFT_LEAD`.
- `..._the_first_draft_is_not_shown_until_its_review_has_run_and_is_shown_after`:
  `show_client` draft is refused before `critique`, and returns the `#show=draft`
  link once the review has run and its finding is answered.
- `..._with_a_builder_holding_the_pages_the_draft_is_not_announced_and_the_running_build_is_named`:
  a builder writes and keeps running, and the round stalls around its `Delegate`.
  In the carried-on rounds, `show_client` draft is refused, naming
  `builder worker-… (started by consultant turn …) holds home.json`. A second
  `Delegate` is refused `scope_held`, naming the same builder and turn and saying
  not to tell the client the draft is ready.

Regression: the BUG-275, BUG-249, REQ-427, BUG-269, REQ-411, REQ-449, BUG-271,
REQ-415, REQ-428, REQ-436, REQ-379, BUG-256, REQ-413, REQ-431, REQ-397, REQ-410,
BUG-235, REQ-448 and REQ-416 workers suites (90 tests), and the REQ-445/444 and
related node suites. Every failure also fails identically on clean xgd-working, so
none is caused by this change:
- BUG-249 `a_turn_that_stalls_twice…`
- REQ-416 priming
- REQ-431 `a_reply_that_links_the_view_inline…` (JSON spacing)
- REQ-428 `the_plan_entry_carries…`
- REQ-361 `a_restructured_box…`
- REQ-408 `weakest_point_falls_due…`