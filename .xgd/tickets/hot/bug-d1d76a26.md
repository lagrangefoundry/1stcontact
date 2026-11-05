---
uid: bug-d1d76a26
id: BUG-256
type: bug
title: 'Consultant: a layout-fault hold ran 17 minutes chasing a finding it could
  not fix, and the client''s three messages during it were never answered'
created_by: EPIC-19
created_at: '2026-10-23T01:06:31.843073+00:00'
updated_at: '2026-10-23T01:48:13.885050+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c29bfe6c
  commits:
  - working_sha: f3e2081bfe823d2b7886ee13cf277f18aaa2e9fc
    reconcile_sha: null
    main_sha: null
  - working_sha: 611c33cd3cf49d87e2d3ca4f64ccae003f089d18
    reconcile_sha: null
    main_sha: null
  version: 0.2.588
  story_points: 8
---

## Symptom (Ariel's Arc Welding, dev, 2026-10-23 00:41–00:59 UTC)

The operator saw the AI "become unresponsive". In fact:

- **One consultant turn ran for 17 minutes** (`2e30bbe2fb1c4185812f373ff033bc54`,
  00:41:40 to 00:58:58). It was the REQ-429/host-holds layout-fault hold
  (`layout-continuation-cue`), started straight after the first draft's turn. The
  client saw "still working, elapsed N min" restart five times.
- In that turn the consultant **delegated five builders in a row**, each about
  4–5 minutes: "Tidying the spacing…", then twice "One last spacing tweak…", then
  "One last spacing fix on the price cards", then "Finishing the spacing…". It was
  chasing the same findings each time.
- **One finding could not be fixed.** It said section 0.2's heading "The work"
  has "36px of space below it, measured between the letters", against 22px
  between "Marine" and the text under it. It asked for 17px or less. Builder
  `worker-builder-9-lyeos6` set `heading-2` `spaceBelow` to 1 and then 0, and the
  check still read 36–37px. The builder then tried about 60 times to "remove the
  element-level `spaceBelow: 0` override" with `set_l1`, which refused each time
  because `home.json` was not in scope. That run took 105 requests and about 11.3M
  cache-read tokens, and never sent a report until the host's "report now" nudge
  at 00:51:35. The 36px very likely spans the grid's gap and card padding, which
  no heading spacing can reduce. So the check's advice ("make the space below it
  at most 17px") cannot be followed in this layout.
- **The client's three messages were never answered.** At 00:44:23 and 00:45:52 the
  client sent a photo with "This is the staircase that we built in The Sentinal…",
  and at 00:46:09 "Did you get the staircase photo". Each was written to the
  junction as `enqueue` (message ids `febc5818…`, `261a0c82…`, `3b7cddcb…`). The
  turn ended at 00:58:58 and **no `turn_start` consumed any of them**. The
  junction has nothing after that `turn_end`. The consultant's final reply does
  not mention the staircase.

## Evidence (kept before the server restart)

- Full copy of `apps/control-app/.wrangler/state/` at 18:02 local:
  `$TMPDIR/hang-180242/state` (`/tmp/claude-501/hang-180242/`, about 3.1 GB). The
  site's junction is
  `do/1stcontact-control-app-dev-SessionJunction/29f6775202ff….sqlite` (site
  `site_5ddc942aac351f9266bd731d2ff3d343`). Its `chunk` rows hold the event
  stream, and seqs to 1957 cover the whole turn.
- Wrangler logs copied alongside it (`wrangler-2026-10-22_22-51-4*.log`). The last
  HTTP requests are three `/api/ai/prompt` 200s at 00:44:23, 00:45:52 and 00:46:09.
- The builder transcripts are D1 comments `comment-54865c7d` (worker-builder-9,
  chat `chat-d0f4062d`) and `comment-19d9220c` (worker-builder-8, chat
  `chat-c1f0c516`).

## What must change

1. **A message sent while a turn runs is always answered.** Once the running turn
   ends, every message the client queued during it runs as the next turn, in
   order, with its photo. Find why the drain (the framework manager's
   `_nextPending` loop, `lagrange-framework/components/ai/js/src/manager.js`)
   did not run after this hold turn. For example, the hold turn may run outside
   the loop that drains, or the request holding the loop may be gone by the time
   it ends. Fix it at that root, not by adding a second drain. If the drain itself
   is upstream, file the fix as a lagrange-framework ticket and keep this one for
   the host side.
2. **The client is not kept waiting behind a hold.** A client message during a
   host hold reaches the consultant at the next call boundary (interpose, as
   REQ-200 does for a running round) or ends the hold. It does not wait
   17 minutes behind it.
3. **A hold gives up on a finding that does not move.** If a fix round leaves a
   finding unchanged (same section, same measurement), the hold stops for that
   finding. The consultant is told it could not be fixed this way, and the hold
   does not start another builder for it. The hold has an overall cap on rounds or
   minutes, so a turn cannot run for a quarter of an hour on checks alone.
4. **The heading-spacing finding is fixable when it is reported.** It measures to
   the next text the client sees as the heading's companion. It names what the
   space is made of (the heading's own space below, a container's gap, a card's
   padding), and its advice names the property that would actually change it. A
   gap that no heading property controls is not reported as the heading's fault.
   This is REQ-429's check, so the fix belongs with it.
5. **A builder that keeps being refused stops.** After the same refusal several
   times in a row (here, `set_l1` refused because the file was out of scope) the
   builder reports what it could not do, instead of repeating the call until it is
   nudged.

## Test plan

- `tests/test_UAT_FC_BUG-256_*`, using the scripted-model host harness:
  - a client message queued during a hold turn runs as the next turn when the hold
    ends, with its content blocks intact;
  - a client message during a hold reaches the consultant inside the hold, or ends
    it;
  - a hold whose finding is unchanged after a fix round stops holding for it, and
    there is an overall cap;
  - a builder repeatedly refused with the same error reports instead of retrying.
- A layout-check fixture: a heading above a padded card grid, where the heading's
  space below is already 0, is either not reported or reported with advice that
  names the grid gap or card padding.
- Re-run the host-holds UATs (layout, then review, then promise) and the REQ-429
  layout-check UATs.


## Diagnosis (2026-10-22, from the saved junction and wrangler log)

- The client reloaded at 00:35:51 (`/api/ai/session` + `/api/ai/reattach`). The reattach tail
  follows one turn only, so it ended at the first-draft turn's `turn_end` (00:41:39). The host
  carried on in the original request with the layout hold (`2e30bbe2…`), and the panel
  believed the consultant was idle. The client's three messages therefore went to
  `/api/ai/prompt`, not to the talker (`/api/ai/interpose`).
- Each of those prompts lost the claim race inside the framework's `promptStream`, which
  degrades into Queue (`enqueue`, seqs 1676/1699/1706) and returns `done {queued: true}`.
- **Nothing drains them.** The framework drains its queue only in `SessionManager._runAndDrain`,
  behind `startTurn`. This host drives every consultant turn through `promptStream` directly
  (`siteTurn`), so the loop that holds the session (`continuedTurn`) is the lease-holder that
  owes the drain, and it never did. That is a host defect, not an upstream one. The upstream
  contract is that whoever calls `promptStream` with the lease drains after it.

## Design

1. **Drain (host).** When the request that holds the session finishes its rounds, it runs every
   message still pending on the junction (`lib.pendingMessages`: queued or undelivered
   interposed), oldest first. Each runs as a client message of its own (`continuedTurn` with
   `fromMessage`, so its `turn_start` retires it), with its content blocks as queued. This is the
   one drain, the host's counterpart of `_runAndDrain`. The holder's single `done` is yielded
   after it, so the request ends when the session is free.
2. **The request that lost the race follows its own answer.** Instead of an empty reply, a
   `/api/ai/prompt` that was queued tails the junction (the `tailSession` projection) until
   the turn that consumes its message ends. The reply streams into the client's own bubble.
3. **A waiting message ends the hold.** At every round boundary of `continuedTurn`, a message
   pending on the junction pre-empts every host continuation (layout, review, promise, budget).
   The request ends there and the message runs next.
4. **A hold gives up on a finding that does not move.** The host's look keeps each page's
   findings for the message. A finding that comes back after a fix round with the same page,
   width, section and kind, and measurements within 2px, is *stuck*. It is no longer owed, so no
   hold is started for it. The consultant is told in the look's result that it could not be
   fixed this way, and not to start another builder for it. A message also has an overall cap
   of `LAYOUT_FIX_ROUNDS` (3) fix rounds. After the cap, remaining findings are reported and no
   longer held.
5. **The heading check measures to the heading's companion.** When the first text below a
   heading sits inside a drawn box that does not hold the heading (a card: background, border
   or shadow), the companion is the box. The space is measured to the box's edge, and the
   "paragraph" comparison against the text inside the card is not made. A reported
   `loose_heading` names what its space below is made of (the heading's own space below, the
   gap of the layout holding both, padding at the top of a box). Its advice names the largest
   part. Where the heading's own space below is already ~0, the advice does not tell it to
   shrink.
6. **A builder refused the same way repeatedly is told to stop.** The BUG-253 run count in
   `runTool` already covers `ReportResult`. It now covers every tool. After
   `REPORT_REFUSAL_LIMIT` (3) identical `Error…` refusals of the same call in a row, the
   refusal carries a line: it will not succeed by repeating it; report what you could not do
   with `ReportResult`.


## What landed (free-coded)

- `host-core.ts`:
  - `answered()` replaces the direct `continuedTurn` call for site sessions. It drains
    `lib.pendingMessages` after the request's rounds and holds its own `done` until the drain
    ends. A prompt that finds the session held (`lib.resolveClaim`) queues with
    `manager.enqueue` and `followQueued()`s its reply.
  - `followQueued()` takes the session itself if nobody holds it and its message is still
    waiting.
  - `continuedTurn` ends at any round boundary where a message is waiting. A round that lost
    the claim (`done.meta.queued`) is never continued.
  - `siteTurn` passes `fromMessage` to `promptStream`.
  - The rejoin projection is shared as `tailEvent()`.
- `host-core.ts` `hostLook`: `layoutHistory` per message records each page's last faults, the
  stuck finding keys and the fix-round count. Unmoved findings are dropped from `layoutOwed`
  and suffixed with `layout-unmoved-note`. After `LAYOUT_FIX_ROUNDS` (3), the report says
  `layout-fix-rounds-spent` and nothing is held, including site structure. The two sentences
  live in `priming.json` (REQ-182).
- `layout-check.ts`: `layoutFindingKey`/`unmovedFinding` (`UNMOVED_PX` = 2). The `heading`
  check measures to a drawn box (background, border or shadow) around what follows, and
  skips the paragraph comparison inside it. Its finding now says "made of …" (own space
  below, the shared layout's row gap, the space at the top of what follows). When the
  largest part is not the heading's own, the advice names that part and says the heading
  does not set it.
- `account-core.ts`: `toolRefused` and `repeatedRefusalHint`. `runTool` counts identical
  `Error…` refusals per tool. From the 3rd in a row (`REPORT_REFUSAL_LIMIT`), the refusal
  carries the hint.

## UATs

- `tests/test_UAT_FC_BUG-256_a_hold_does_not_keep_the_client_waiting.workers.test.ts`
  (real route in workerd, scripted model and browser):
  - `…a_message_sent_during_a_hold_ends_it_and_is_answered_next_with_its_photo`: a second
    `/api/ai/prompt` during the layout hold is answered as its own turn, attachment line
    intact, and streamed to its own request. Only one hold round runs.
  - `…a_finding_a_fix_round_left_unmoved_is_not_held_for_again`: a finding at 36px, then
    37px, after a fix round is held no more.
  - `…a_request_holds_for_layout_for_at_most_its_fix_rounds`: the 4th fix round says the
    rounds are spent.
  - `…a_builder_refused_the_same_way_again_and_again_is_told_to_report`: the 3rd identical
    out-of-scope `set_l1` refusal tells it to report.
- `tests/test_UAT_FC_BUG-256_the_heading_check_names_what_it_can_fix.test.ts` (real
  Chromium; in the sandbox run with `CHROMIUM_LAUNCH_ARGS=--single-process`):
  - a heading over a padded card grid is not measured against the card text. The old check
    reproduces the incident's "make the space below it at most 15px" here.
  - a loose heading names what its space is made of and the part to change.
- All of them fail against the code before this change. Regression: every workers and node
  suite that touches `host-core`/`/api/ai/prompt`/`layout-check`, including the REQ-415
  layout-check suite and the REQ-429, BUG-238 and REQ-420 heading suites. Remaining
  failures (BUG-129, REQ-208, REQ-295, REQ-342, REQ-416 priming, REQ-146 router scrub,
  REQ-127/128/285, the reconciliation suites) fail identically without this change.

## Known gaps (not in this change)

- The settings conversation (`streamPrompt`'s business branch) also drives `promptStream`
  directly and is not drained.
- `/api/ai/reattach` still ends at the first round's `turn_end`, so a reloaded panel
  believes the consultant is idle during a host continuation. That is how the incident's
  messages reached `/api/ai/prompt`. They are now answered, and the reply streams to the
  sending request, but the panel's busy state during a hold after a reload is still wrong.
- If the talker failed and an inbox message was interposed after the round's last call
  boundary, it can be answered twice: once by the drain, once by the panel's fallback
  prompt.