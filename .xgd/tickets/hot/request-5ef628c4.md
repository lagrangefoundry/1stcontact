---
uid: request-5ef628c4
id: REQ-459
type: request
title: 'Progress: one story of what''s happening — the chat''s working line updates
  in place and ends as a past-tense summary, matching the progress area, instead of
  stale ''about 15 minutes'' lines per step'
created_by: EPIC-19
created_at: '2026-10-25T17:58:55.850293+00:00'
updated_at: '2026-11-04T19:02:59.200766+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4ec4f4e0
  commits:
  - working_sha: fcf43c3d1de404807c4d0cae7ab83e02b5454d00
    reconcile_sha: null
    main_sha: null
  version: 0.2.638
---

## Symptom

First-Draft-Test Dina's Diner 2, during the first-draft build. The operator: "The
progress information is still a bit scattered." At the same moment:
- **in the chat**, as italic text: "*Building your home page first draft, with
  the top banner and footer. It takes about 15 minutes.*", the note the first
  `Delegate` was given when the build started;
- **in the progress area** (the workers status, REQ-431 / BUG-244): "The
  consultant: Last tidy-up on the phone view of the home page. A few minutes", the
  latest step's note.

The chat line is written once when a step starts and stays as permanent text, so
it goes stale while the progress area moves on. Two places say different things
about the same work, and the one in the conversation is the out-of-date one.

## Cause

A step's note (`Delegate`'s `note`, the model-sourced `progress` frame) reaches
the client twice, through two paths:
- as a working note written into the chat transcript as text (BUG-245 / the
  `_…_` working line);
- as the status widget's current line.

The transcript copy is never updated or closed. A turn with several steps leaves
a trail of italic "about N minutes" lines, each true only when it was written.

## Fix

**One source for "what is happening now", and the chat records what happened.**
1. **The progress area is the only live display.** Its line is the current step's
   note, with BUG-257's step-relative estimate (and BUG-93's wording), and it is
   always the latest.
2. **The chat carries one live line per turn, not one per step.** While a turn
   is working, the chat shows a single working line that **updates in place** to
   the current step, the same text as the progress area, without adding new lines.
   When the turn ends, the line becomes a **past-tense summary** of what was done,
   for example "Built your home page first draft and tidied the phone view (18
   minutes)", or, if it ended early, what was left (BUG-277, REQ-436).
3. **Nothing in the transcript keeps a future-tense estimate.** A reopened
   conversation shows the past-tense summaries, never "it takes about 15 minutes"
   for work that has already finished.
4. Both displays read the same progress frames. Neither keeps its own copy of the
   text.

## Test plan

`tests/test_UAT_FC_REQ-459_one_progress_story.*`, using jsdom on the builder chat
plus the scripted host harness:

- A turn with two delegated steps: the chat shows one working line, which changes
  from step one's note to step two's note, and the progress area shows the same
  text at each moment.
- When the turn ends: the chat's line is a past-tense summary, no step note
  remains in the transcript, and the progress area shows idle.
- A reopened conversation (reattach) shows the summary and no "about N minutes"
  lines for finished work.
- Re-run the BUG-244, BUG-245, BUG-257 and REQ-436 UATs.

## Implementation design

**Host (`tools/generate/src/cli/ai/cadence-core.ts`, `keepClientOriented`).**
- The first `Delegate` of a round no longer writes its `note` into the reply as an
  italic line. The note still becomes the round's status (`progress`, REQ-390 /
  REQ-416), which is the only place it is shown. BUG-265's "Meanwhile, N
  question(s) need you: [answer …]" link is still said once, at that moment, as
  plain text. It is a present-tense pointer, not an estimate.
- `Delegate` takes a second parameter, `done`: the same step in the past tense
  ("Built your home page first draft"). Optional in the schema, so a call without
  it is never refused, but the description asks for it every time.
- When a round that delegated ends, the host records **one** italic line in the
  reply, the past-tense summary. It lists the `done` phrases of the hand-offs that
  returned, joined in order ("A, then b"), and the time since the first hand-off
  ("(18 minutes)", "(1 minute)", "(under a minute)"). A hand-off without `done`
  reads "Finished a build". If the round ended early (a hand-off never returned,
  its result was an error, or the round's status was not `complete`), the line
  ends "— stopped before the rest was finished", or reads "Stopped before the build
  was finished (…)" when nothing returned. What was left is the consultant's own
  report (BUG-277 / REQ-436). The line is the assistant's words, so it is in the
  transcript and on reopen. No step note ever is.
- Slow-tool steps (`capture_site`, …) are unchanged: status only (BUG-215), and
  not part of the summary.

**Chat pane (`apps/control-app/src/builder/chat.js`).**
- One working line per stream of work (`.builder-chat-working`), kept at the end
  of the transcript. It is built from the stream's `progress` frames, the same
  frames the status widget draws, with the widget's rule: a `model` line wins over
  a host heartbeat. Each new frame **replaces** its text, so a turn never adds a
  second line. It is not a message and is never in `getMessages()`. When the
  stream closes it is removed. By then the host's recorded summary has been drawn
  in its place.

**Supersedes** (explicit; this ticket's later intent wins):
- REQ-379 / BUG-215: "the first Delegate's note is the assistant's own words in the
  chat / transcript". The note is now status only. The panel count still precedes
  the hand-off, and the transcript carries the past-tense summary. The UATs are
  renamed to the new contract:
  `test_UAT_FC_REQ-379_a_delegate_call_shows_its_note_as_status_and_the_panel_count_before_the_builder_session_completes`
  (was `…shows_its_note_and_the_panel_count…`) and
  `test_UAT_FC_REQ-379_with_no_open_asks_nothing_is_said_before_the_hand_off`
  (was `…with_no_open_asks_the_line_says_only_what_is_being_built`).
- REQ-416 ("the old working line is gone", from REQ-390's live line) and BUG-247
  ("no progress note became chat text"). The conversation again has a working line,
  but exactly one per stream of work, identical to the status widget, and never a
  message: `getMessages()` and the bubbles never contain it. The assertions in
  `test_UAT_FC_REQ-416_a_message_during_the_build_goes_to_the_talker…` and
  `test_UAT_FC_BUG-247_the_answer_first_turn_shows_the_widget_and_send` say exactly
  that now.

## UATs

- `tests/test_UAT_FC_REQ-459_one_progress_story.test.ts` (jsdom, real
  `createChatPanel` + `webui-chat`): two steps' `progress` frames give one working
  line whose text changes from step one to step two, matching the status widget's
  text at each moment. At the end the line is gone, the summary is the bubble's
  text, and the status widget is hidden.
- `tests/test_UAT_FC_REQ-459_one_progress_story.workers.test.ts` (scripted host
  harness): a turn with two `Delegate`s says no note as text, and ends with one
  past-tense summary carrying both `done` phrases and the minutes. A reopened
  session's transcript has the summary and no note. A round whose hand-off was
  refused (no design yet, REQ-448) reads "Stopped before the build was finished
  (…)".
- Identical consecutive `done` phrases are said once (so two hand-offs without
  `done` read "Finished a build", not twice). This is covered by the REQ-379 UATs,
  whose calls give no `done`.

## Baseline (pre-existing failures, identical on clean xgd-working)

BUG-244 (plus-in-composer), BUG-245 priming, BUG-275 (both stall cases), REQ-295
(two), REQ-340 (nine), REQ-342 (three), REQ-416 workers priming, REQ-431 inline
link, REQ-122 manual priming, AC1058, REQ-208 vendor. None of them touch this
change.