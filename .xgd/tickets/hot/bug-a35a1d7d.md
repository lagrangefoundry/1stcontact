---
uid: bug-a35a1d7d
id: BUG-403
type: bug
title: 'Progress: one whole-job bar with one countdown to done, milestones in the
  chat, instead of three unlabelled clocks'
created_by: EPIC-19
created_at: '2026-11-09T16:23:35.065854+00:00'
updated_at: '2026-11-09T19:51:52.248335+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d25d3a23
  commits:
  - working_sha: 9319bdc0a6e11897aacb3478aa805ee8eb88c96f
    reconcile_sha: null
    main_sha: null
  - working_sha: 6e9714e0b272b7a1ba921b8d6c72f6acd03e261f
    reconcile_sha: null
    main_sha: null
  version: 0.2.853
  story_points: 8
---

## Symptom

During builds the status box reads like *"about 5 minutes left about 3 min left, 17:48 so far"* or *"finishing the checkout, order and cancelled pages — 1 of 2 done, about 2 minutes left"*. Operator: *"That makes less than no sense."* And: *"I do not really care if the consultant can't estimate its own work time — I just want to know whether I should go and get a cup of coffee or whether it's about to come back."* BUG-215, BUG-257 and REQ-459 each tidied one part of this line; it was never designed around what the client needs.

## Root cause

Three unlabelled numbers from three clocks:
- **"about 5 minutes left"** is written into the status text by the host when a step's line is posted (`progressText` in `tools/generate/src/cli/ai/estimate-core.ts`, joined by `workingLine` in `cadence-core.ts`, REQ-625). It's the job's time left at that moment and never changes.
- **"about 3 min left"** is the framework widget counting the same estimate down from the step start (lagrange-framework `webui/chat/js/src/status.js`).
- **"17:48 so far"** is the widget counting from the client's message, including reading, planning and earlier work.
- **"1 of 2 done"** is the host's step count, which the client can't act on.

## What the client needs (operator, 2026-11-09)

1. **A sense of progress:** things are happening, it isn't stuck.
2. **How long overall** until the work is finished: stay, or go and get a coffee.
3. **When a part is finished,** so they can look at it.

## Design (operator decisions, 2026-11-09)

**The progress area: one bar, one countdown, one line of activity.**

```
Building your checkout pages
[████████████░░░░░░░░░░░░░]
About 4 min · checking the order page on a phone
```

1. **One bar for the whole job, never per step.** It shows only for planned work with an estimate; a quick reply or a slow tool shows "Working…" with no bar.
2. **It leaves 0% at once.** The moment the job starts it shows a small first step (about 3–5%), before any real progress.
3. **It never moves backwards; it only slows.** It fills by time: elapsed ÷ (elapsed + estimated remaining), so a finished step can speed it forward but nothing moves it back. The closer it gets to the end, the more it slows, and it never quite gets there by itself: if the work runs long it creeps towards about 95% and waits there.
4. **It reaches 100% only when the job is really finished.**
5. **One countdown, to the end of the whole job,** under the bar, never for a step. It counts down in whole minutes ("About 6 min", "About 5 min"…, then "Less than a minute"), with no seconds. The remaining time is re-estimated after each step from the actual pace (BUG-371). If it grows, the countdown shows the new figure honestly, while the bar still doesn't move back.
6. **At zero it switches to words:** "Almost done — taking a little longer than expected". It never shows 0:00, never goes negative and never counts up.
7. **A line of current activity** beside the countdown ("checking the order page on a phone"), changing as the work moves. It's the proof of life during the long stops a bar can't avoid. If nothing has changed for a few minutes, it says so plainly: "Still working — this part is slow".
8. **No step counts and no elapsed clocks** anywhere in the progress area.

**Milestones go in the chat, not the progress area.**

9. When a part of the job is finished and can be looked at, the chat gets one line with a link to it, e.g. "Checkout page is ready — view it". The preview already updates by itself (BUG-192). These lines join REQ-459's past-tense story of the turn.

**Telling the client it's done.**

10. When the job finishes, the builder tab's title changes (for example "✓ Done — 1st Contact") until the client next looks at the tab. The first time a job's estimate is long (over about 8 minutes), the builder offers browser notifications once; if the client accepts, finished jobs also notify.

## What this ticket covers (host side), and what lagrange-framework covers

- **Here (host):** progress records carry the job's title ("Building your checkout pages"), the job's start time, the estimated remaining time for the whole job (recomputed after every step), the current activity line, a "finished" signal only at true completion, and a milestone event with a link whenever a part completes. No time and no step count goes into any text the client sees. The milestone becomes a chat line. The builder implements the tab title and the one-time notification offer.
- **lagrange-framework BUG-117:** the widget: the bar's motion rules (items 2–4), the countdown and its zero wording (5–6), the activity line and stall wording (7).

## Test plan

UATs `test_UAT_FC_BUG-<n>_*`:
- a planned job's progress records carry no time, minutes, "left" or "N of M" in any client-visible text; they carry the job title, job start, whole-job remaining time and current activity;
- after each step finishes, the next record's remaining time is recomputed for the whole job from the actual pace;
- each completed part produces exactly one chat line with a working link to what finished, and nothing in the progress area;
- the finished signal is sent only when the last step completes, not when an estimate runs out;
- driving the real widget with a recorded job: the bar is above 0 straight after the first record, never decreases across records (including when the estimate grows), stays below 100% until the finished signal, and reaches 100% on it;
- when the job ends, the builder tab's title shows the done marker until the tab is next focused;
- a quick reply with no planned job shows "Working…" and no bar.

## As built (2026-11-09)

Built on lagrange-framework BUG-117 (installed): `manager.progress` takes `jobTitle`, `jobRemainingS`, `activity` and `jobDone`, sets `job_started_at` itself and carries the job from record to record within a round.

### Host (`tools/generate/src/cli/ai`)

- **No time and no count in the words.** `workingLine` (cadence-core) now returns only "<who> is building …" plus the job's fields (`JobStatus` in estimate-core). Planned work sends no `eta_s`. A slow tool outside planned work keeps its own measured `eta_s`, as before. `progressText` ("2 of 6 done, about 25 minutes left") is now only the consultant's notice (`estimateNotice`). The speak-first stand-in line (BUG-292/298) says "…; about N minutes left" for planned work, with no step count.
- **The job's title** is the first note that puts up a piece of work (`StepQueue.entitle`, `jobTitle`: one line, capital first, no closing full stop). It is kept until the job ends.
- **The activity** is the current step's note in the same form ("Building the about and services pages now").
- **The whole job's remaining time** is `StepQueue.progress()` (BUG-371's pace re-work), sent in seconds on every record. After each step the job's time left is re-worked and re-sent.
- **`job_done` only when the last step finishes:**
  - in-round, the cadence wrapper sees the queue go from some steps to none and posts one final record;
  - for a detached pass (REQ-627), the host's own `progress` event carries the job fields (`jobMeta`, progress-core) and `job_done` when it was the last step.

  An estimate running out never sends it.
- **One bar across the job's rounds.** The manager starts a job afresh in every round, and the widget clears itself on a new `turn_id`. So the job stream (`followJob`) passes each `progress` frame through `JobFrames` (progress-core). It pins the first frame's `job_started_at` and `turn_id` for every later frame of the same job (same title, or none). A new title starts a new job, and `job_done` ends it. `progressEvent` passes the five job fields from the junction record into the frame.
- **The heartbeat repost** (REQ-461 `slowToolHeartbeat`) re-sends only the activity. Re-sending a stale estimate would move the countdown back up.
- **Milestones in the chat:**
  - when a builder step's result comes back having written pages, the host writes one line linking each page by name: "[Prices page](#show=draft&page=prices) is ready." (`readyLine` in show-core, `readyFor` in host-core, the `ready` cadence hook);
  - a step that ran in the round says it right after its tool activity;
  - a detached step's line, delivered as a round opens, is said with that round's past-tense story: at the round's end, or at its re-hand-off;
  - a site-wide change links the home page (the same `shownPages` rule as before);
  - the same line is said at most once a round.
- **Explicit supersessions:**
  - **REQ-436's talker build-done cue is removed.** That covers the `build-done-cue` template, `buildDoneCue`, `pageDoneLine` and `announceBuild`. The host's line replaces it, so the link no longer depends on a model saying it.
  - **REQ-625's client-visible "k of N done, about M minutes left"** is replaced by the job fields.
- **BUG-279's first-draft hold** (`announcesDraft`) now reads a paragraph's words, not its link targets. The milestone line's `#show=draft&page=…` href held it as if it handed over the whole draft. The rule's own comment says one page's link is progress and never held.

### Builder (`apps/control-app/src/builder`)

- **`job-done.js` (`jobDoneSignals`)** is fed every `progress` frame the chat pane sends to the widget.
- **On `job_done`** with the tab hidden or unfocused, the tab's title becomes "✓ Done — <title>". It returns to the old title on window focus or when the tab is visible again. A re-sent done record for the same job does nothing.
- **The first record with `job_remaining_s` over 8 minutes** (when notification permission is still `default`) puts an offer in the chat: an italic panel message with a "Tell me when it is done" button. This happens once per browser (`localStorage` `builder-notify-offered`). The browser's permission prompt is asked only when the button is pressed.
- **Once permission is granted,** a finished job also shows a `Notification("Done", { body: <job title> })` while the tab is not being looked at.

### Not changed

- **"No news from the job for N min — it is still running."** (BUG-343, a quiet job stream) is still a model-source line. In job mode the widget shows it as the activity.
- **A reattach mid-job** pins to the first frame it sees. The bar never moves back within a stream, but it may start lower than before the reload.

## Test plan (as built)

- `tests/test_UAT_FC_BUG-403_job_records_and_milestones.workers.test.ts` drives the real routes (`/api/ai/session`, `/api/ai/prompt`), D1, the session machinery and delegation, with only the Anthropic client scripted:
  - a planned three-step job's progress words have no digits, "minutes", "left" or "N of M done";
  - its frames carry one title (the first note's), one `job_started_at`, a numeric `job_remaining_s`, each step's activity, and no `eta_s`;
  - the first `job_remaining_s` is the whole job's measured time; after each step it is the whole job's time left at the job's pace;
  - exactly one `job_done`, the job's last record, after the last Delegate came back;
  - one "[Home page](#show=draft&page=home) is ready." line in the chat, and nothing of it in any progress frame;
  - a quick reply and an unplanned slow tool carry no job fields.
- `tests/test_UAT_FC_BUG-403_progress_area_and_done_signals.test.ts` (jsdom) uses the real chat pane and the installed `webui-chat` widget. It feeds a recorded three-round job through the host's own `progressEvent` and `JobFrames`:
  - the bar is 3–5% after the first record, never decreases (an estimate that grows, new rounds, an overrun) and stays ≤95 until `job_done`, then reaches 100;
  - no step count or clock appears in the progress area;
  - the tab title shows the done marker while the tab is unfocused, until focus;
  - a long job offers notifications once, ever. The permission is asked only on the button, and a finished job then notifies once with the job's title;
  - a quick reply and an unplanned slow tool show no bar.
- Updated to the new behaviour:
  - REQ-625 and REQ-627 UATs: the time left and the job are fields, one job across rounds, `job_done` only at the end, and not done when a pass left work;
  - REQ-390: no time in the words, `job_remaining_s`, the done record;
  - BUG-257: the done record begins no step;
  - REQ-459 (workers): a lone pass's job and its done record;
  - REQ-436 and BUG-266: the host's ready line instead of the talker cue;
  - REQ-467: `readyLine` names its link's destination.