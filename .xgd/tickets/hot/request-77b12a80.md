---
uid: request-77b12a80
id: REQ-379
type: request
title: 'Plan panel and consultant cadence: progress counter, announce before going
  quiet, milestones that fall due'
created_by: EPIC-19
created_at: '2026-10-04T01:19:03.873246+00:00'
updated_at: '2026-10-04T02:34:14.685293+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-eb212a9a
  commits:
  - working_sha: 1fc49e82237ef7f6a9a6e8df7fe332bbe5107618
    reconcile_sha: null
    main_sha: null
  - working_sha: 92351ffeb4f8df44b4c0506cc8e1c14e4dfbe9cd
    reconcile_sha: null
    main_sha: null
  version: 0.2.475
---

## What changes

The consultant **keeps the client oriented**: before going quiet, while quiet, and at the milestones of a build. The panel shows at a glance how much is left for the client to fill in. These are made reliable by the host acting on the plan and on what the consultant is doing, not by priming alone.

## Why

Charlie's Plumbing 2 (EPIC-19 Finding 18) had consultant turns of 17, 28 and 10 minutes, and **none** said beforehand that the consultant was going away, for how long, or that the panel needed the client in the meantime. The client was pointed at the panel once, at the start. The plan's process layer never moved: `phase` stayed at `intake`, `functionality` stayed empty, and none of the 8 milestone questions (`checks`) was ever asked. A priming rule for the announcement (`plan-panel` entry, "Before you go away to work, say in one line…") was added after that run, at 61fcee5863. This ticket makes the behaviour hold even when the model forgets, which Finding 13 and Finding 18 both show it does.

## Requirements

1. **A progress line at the top of the plan panel** (operator request), directly under its "Getting to know your business" heading. It counts the open asks: **"3 questions still to answer"**, and when none are open, **"All done — thanks, that's everything I need for now."** Withdrawn and skipped asks don't count. It updates as soon as an ask is answered, and when the consultant adds a new one.
2. **Announce before going quiet.** When the consultant starts a builder session (`Delegate`) in a turn that hasn't yet told the client it's going away, the client sees a status line in the chat straight away, before the work runs, not when the turn ends. It says what's being built and roughly how long it takes. The `Delegate` call carries a required short note for the client, so the consultant supplies the words and the host guarantees they're shown.
3. **Point to the panel while quiet.** If asks are open when that status line is shown, it adds **"Meanwhile, N questions above need you"**, using the same count as requirement 1.
4. **Milestones fall due as facts.** The host marks a milestone question as due when its trigger can be detected mechanically: the first builder session that completes a page (`first_pass_complete`), a revision round counted since then (`revision_round_finished`), and Publish being opened (`before_publish`). The due milestone appears in the consultant's per-turn digest as a fact ("Due: ask whether the layout is right"), and an asked or answered milestone records its answer in the plan's `checks`.
5. **A stale phase is flagged.** The panel shows the plan's `phase`. When the build has visibly moved past it (pages built while `phase` is still `intake`), the consultant's digest says so, so the consultant moves the phase on.
6. **Features are captured first.** A new plan starts with one multi-select ask, "Which of these does your site need?", drawn from the feature catalogue. That gives the plan's `functionality` list content, so "are we done?" has something to be measured against.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- The panel shows "N questions still to answer" with N = open asks, and the all-done message at zero; answering an ask updates it.
- A `Delegate` call in a turn shows the client its status line before the session completes, and includes the panel count when asks are open.
- A completed first-page builder session makes `layout_happy` due in the next turn's digest.
- A plan at `intake` with built pages yields a stale-phase line in the digest.
- A new plan carries the features ask.

## What landed

1. **Progress line** (`plan-panel.js`, `config.js`, `builder.css`): `.plan-panel__progress` sits directly under the phase line ("Getting to know your business" is the `intake` phase label). It reads "N questions still to answer" ("1 question" singular) or "All done — thanks, that's everything I need for now." Only `open` asks count; skipped, answered and withdrawn ones don't. It is redrawn from every view the panel draws, so it moves when an answer saves and when a mid-turn `plan_changed` re-read brings in a new ask. It is hidden before a site's plan has been read.
2. **Announce before going quiet** (`cadence-core.ts`, wired in `host-core.ts`): `Delegate` takes a required `note` param, added host-side to the framework's declaration (`withClientNote`, applied in `reportingDelegationToolbox`). A wrapper on the consultant's backend stream (`keepClientOriented`, beside `narrateExhaustion`) sees the framework's `tool_issue` event before the call runs. On the **first** `Delegate` of a turn it yields the note as text: an italic line, capped at 240 characters, with a fallback sentence if the note is missing. The manager records that text as the assistant's own words, so it shows live, stays in the transcript, and the next turn reads it. Later `Delegate` calls in the same turn are not announced again.
3. **Point to the panel**: the same line adds "Meanwhile, N questions above need you." ("1 question above needs you") when asks are open. N is the panel's own open count (`planPanel(...).asks.open.length`). With no open asks it adds nothing.
4. **Milestones fall due** (`plan-core.ts`): plans gain `milestones` {`first_pass_at`, `revision_rounds`, `publish_opened_at`} and each check gains an optional `due` {`trigger`, `at`}. Both are stored by `plan.ts` and declared in the ticket type pack.
   - A `Delegate` that comes back `outcome: reported` with `wrote: true` is a completed builder session. The first sets `first_pass_at` and fires `first_pass_complete`. Each later one adds a revision round and fires `revision_round_finished`.
   - `POST /api/publish` fires `before_publish` the first time Publish is pressed. It fires before publishing, only for a site that exists, and on a best-effort basis: a failure never blocks the publish.
   - A fired trigger marks every check that names it as `due`.
   - The per-turn plan entry (`planReminder`) leads with `Due: ask the client "<question>" (<id>) — <why>. Record that you asked with ask_check and their answer with record_check_answer.`
   - `ask_check`, `answer_check` and `record_check_answer` each clear `due`. `read_plan`'s panel adds `due_checks`.
5. **Stale phase**: `phaseBehind` works out the phase the build has reached from the milestones: `first_pass` after the first pass, `revision` after a revision round, `prelaunch` after Publish was opened. When the plan's `phase` ranks lower, the plan entry says "The phase is behind the build: it still says intake, but pages have been built. Move it on to first_pass with set_phase."
6. **Features first**: `plan-seed.json` gains a `feature_catalogue` (13 client-worded features) and an `asks` list holding one `features` ask: "Which of these does your site need?", `multi_choice`, with options drawn from the catalogue (`options_from`). `seedPlan` seeds it, so plans created from now on have it; existing plans are untouched. When the client answers it (or an agent fills it), every picked option becomes `wanted` in `functionality`. A catalogue feature that the previous answer picked and the new one doesn't becomes `not_wanted`. Features recorded any other way are left alone.

## Design decisions made during implementation

- **Grant change, so the consultant can act on the facts.** `ask_check`, `record_check_answer` and `set_phase` moved from `CoordinatePlan` into a new `KeepMilestones` group, which both roles are granted. With the room off there is no coordinator, which is why `phase` never moved in Finding 18. `CoordinatePlan` keeps `record_client_answer` and `set_task_status`. The rule "the coordinator is never an answerer" is still enforced on the data (`by` ∈ alice/user).
- **What counts as "completes a page".** A builder session counts if it reported and the host's own record shows it wrote the site. A session that wrote nothing is not a milestone. The host can't tell a "revision" from any other piece of work, so every completed session after the first counts as one round.
- **"Publish opened"**: the builder has no publish dialog, so pressing Publish (the request reaching `/api/publish`) is the opening. It fires once per plan, not on every republish.
- **Once a turn**: the host's status line is itself the "telling", so a second hand-off in the same turn doesn't repeat it.
- **Prose placement**: the `note` guidance went into the `delegation-method` priming template, which renders only where delegation is composed, so a deployment with delegation off is never told about `Delegate`. The surface overview gained a "Milestones fall due" paragraph. The existing `plan-panel` priming line is unchanged.
- The panel's old comment, "never frame progress by how few questions are left", is about progress on the *build*. It was updated to separate that from this count of what is left for the *client*.
- Existing UATs that scripted `Delegate` without a `note` now pass one, since the note is required. REQ-364 and REQ-356 assertions that pinned "a new plan has no asks", the old schema key list and "the consultant has no record_check_answer" were updated to the new intent.

## Test plan (as built)

- `tests/test_UAT_FC_REQ-379_plan_panel_progress.test.ts` (jsdom, the real builder):
  - Count under the phase heading, with skipped and answered asks excluded.
  - Answering an ask updates the count; singular wording at one; the all-done message at zero.
  - The count rises when the consultant adds an ask mid-turn.
- `tests/test_UAT_FC_REQ-379_consultant_cadence.workers.test.ts` (real routes, D1, delegation surface on both sides; the model client is the only double):
  - The `Delegate` schema requires `note`.
  - The status line streams before the `Delegate` tool frame, carries "Meanwhile, 3 questions above need you." and is announced once per turn. It is recorded as the assistant's words.
  - With no open asks, the line has no "Meanwhile".
  - A completed first builder session makes `layout_happy` due (`first_pass_complete`), and the next turn's plan entry carries the Due line and the stale-phase line. The consultant's `ask_check`, `record_check_answer` and `set_phase` record the answer in `checks`, clear `due` and move the phase, after which both lines are gone.
  - A later builder session counts a revision round and makes `layout_happy` due again.
  - A session that wrote nothing is not a milestone.
  - `POST /api/publish` makes `quality_bar_met`, `seen_on_phone`, `scroll_feel` and `ready_to_publish` due, and the next turn is told.
  - A new plan's `/api/plan` carries the features ask with the catalogue as its options. Answering it fills `functionality`, and changing the answer moves it.