---
uid: bug-82d9a5b5
id: BUG-360
type: bug
title: 'Consultant time estimates: re-survey step times since containers, and say
  only measured numbers'
created_by: EPIC-19
created_at: '2026-11-05T21:03:21.416017+00:00'
updated_at: '2026-11-05T22:01:36.236812+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3482d7d1
  commits:
  - working_sha: fa0825acc687ba68f9f52c8482be3eadf9590b5c
    reconcile_sha: null
    main_sha: null
  - working_sha: 7cc2ea46448d845acafdc84d9e11abffcd71981a
    reconcile_sha: null
    main_sha: null
  version: 0.2.788
---

## Symptom (operator, 2026-11-05: "our time estimates seem way off")

What the consultant told the client, against what happened, in two dev runs today:
- "about 3 minutes" → 8 minutes
- "about 2 minutes" → 4 minutes
- "15–20 minutes" for a first draft → 13 minutes

The client plans around these numbers. When an estimate is wrong in either direction, they stop trusting the rest of what the consultant says.

## Cause

1. **REQ-625 (2026-11-01) measured real step times,** stored in `slow-tools.json` and read by `estimate-core.ts`. But only the host's status line uses them. **The consultant's own spoken estimates are guesses.** It isn't given the measured figure for the work it is about to start, so it invents one.
2. **The measurements predate two changes that alter timings:**
   - builder passes now run in job containers (EPIC-32), which adds start-up time;
   - the host's layout check adds **fix rounds** after a pass (up to 3 per request). These aren't a step kind, so they're never counted.
3. **Slow tools are missing from the table:** clip generation (an image edit plus a clip, minutes each), captures and critiques are partly or entirely absent.

## What

1. **Re-survey.** Re-run REQ-625's measurement (its script is on COMMENT-6230) over the runs since the container cutover, from production and dev D1 (`turn_log`, `request_spend`, tool transcripts).
   - Measure per kind: builder pass by scope (section, page, pages, site), **layout fix round**, clip generation (still edit and clip separately), capture, critique, and the consultant's own time between steps.
   - Report median and 80th percentile with `n`, and leave out lost, stopped and refused passes (BUG-357's refusals).
   - Commit the results as the new `measured` table and record the method in the file's `about`, so the next re-survey is mechanical.
2. **Spoken estimates come from the table.** Whenever the consultant states a duration, it uses the host's number:
   - `Delegate`'s result, the slow-tool notice, or a short "how long" line given to it before it speaks, built from the declared steps plus the expected fix rounds;
   - the 80th percentile, rounded up (it is better to finish early than late), never a figure of its own;
   - prompt text that tells it so (DOC-75), alongside the code that gives it the number.
3. **An ongoing accuracy check.** Each finished job records estimated against actual minutes, and the operator can see the error per kind, so drift shows up without a manual survey.

## Not in scope

- Making anything faster.
- The client-facing progress bar (under discussion in EPIC-19).

## What changed

**1. The re-survey is a command.** `1c estimates survey [--since ISO] [--local file.sqlite,…] [--remote-env env,…] [--write] [--json]` (`tools/generate/src/cli/estimate-survey.ts`, measuring in `ai/estimate-survey-core.ts`) replaces REQ-625's one-off script.
- It reads `request_spend`, `turn_log` and the tool and chat transcript comments. The default source is the dev D1; `--remote-env` reads a deployed D1 through wrangler, read-only. Rows from several sources are pooled.
- It measures only container jobs (a `turn_log` row with `wall_s`) since `--since`, which defaults to the cutover, 2026-11-05T00:50Z.
- **A builder pass** is timed from its `Delegate` call to the start of the round its result opened (`<job>-delivered-N`). Container start-up, the builder and the host's look are all in that figure.
- **Kinds by scope:** `section` (one page's sections, or only the shared header, footer or design), `page`, `pages` (two or three), `site` (four or more, or several pages with `site.json`: a first draft).
- **A `fix_round`** is a pass handed off after a prompt that reported faults ("THIS BUILD IS NOT DONE" or the layout continuation cue). `fix_rounds_per_pass` is the number of fix rounds per ordinary pass.
- **Slow tools** are timed from the end of the request that issued the call to its result, counting only a call that was the batch's one slow call. **The consultant's time** runs from a delivery to its next hand-off.
- Each figure is a median and an 80th percentile with `n`. Lost passes (no delivered round), stopped passes (the result's own `outcome` is stopped, exhausted or abandoned) and refused hand-offs are left out and counted.
- `--write` rewrites `slow-tools.json`. A kind with no run in the window keeps its earlier figure, and `measured` names it. `about` records the method.

**2. The measured table (2026-11-05).** Dev D1: 854 requests over three sites' first drafts and refinement. Production had run no container job yet (migration 0048 isn't applied there). Minutes, median / p80 (n):

| Kind | Median | p80 | n |
|---|---|---|---|
| section | 4.2 | 4.6 | 2 |
| page | 6.7 | 8.4 | 2 |
| pages | 7.6 | 11.3 | 2 |
| site | 10.8 | 11.5 | 5 |
| fix_round | 6.6 | 7.4 | 19 |
| consultant between steps | 0.5 | 0.9 | 30 |
| capture_site | 1.8 | 3.4 | 2 |
| critique | 2.1 | 2.1 | 1 |
| EditImage | 1.3 | 1.3 | 1 |
| AnimateImage | 2.6 | 2.7 | 2 |
| import_from_site | 0.4 | 0.6 | 2 |

- 1.73 fix rounds follow an ordinary pass (19 after 11). This is why "about 3 minutes" became 8.
- CreateImage had no run in the window, so its REQ-625 figure stands.
- Left out: 1 lost, 0 stopped, 17 refused.

**3. Estimates come from the table (`estimate-core.ts`).**
- Each kind's estimate is its **p80**. A job is Σ(p80 + consultant p80) over its steps, plus `fix_rounds_per_pass` × (fix_round p80 + consultant p80) for each ordinary builder pass. The total is **rounded up** to the next 5 minutes, never under 5 ("about 25 minutes"); "a few minutes" is gone.
- A slow tool's own figure is its p80, rounded up to whole minutes.
- One of each step today: a section about 20 minutes, a page about 25, two or three pages about 30, a first draft about 30.
- `fix_round` can't be declared: it isn't in `Delegate`'s `steps` kinds. The host counts a pass as a fix round when it's handed off while layout faults are owed (the same test `hostLook` counts rounds by). Such a pass doesn't take a planned step.

**4. The consultant hears the host's number before it speaks.**
- *Rules:* rule 8 lists the host's figure for one of each builder step (the `{estimates}` slot, `stepFigures()`). It says time estimates "are the host's, never yours". The guessed "a first draft takes about 15–20 minutes" is deleted.
- *Examples:* the "30–40 minutes" example in rule 8, the talker priming and `email_when_ready` now reads "about [the host's time left]". The plan step reads "how long in the host's figures".
- *Speak-first refusal:* on a round the host started, a refused `Delegate` or slow tool is answered with the host's figure for that very call ("The host's estimate for this call: about 50 minutes."). It is computed from the declared steps (or the scope) plus fix rounds. The refusal also says "in the host's figures and never a time of your own".
- *While work is under way:* every request's notice gives the time left (REQ-625's `estimateNotice`, now at p80 with fix rounds).
- `email_when_ready` with no steps declared quotes the table's first-draft figure, not "about 30–45 minutes".

**5. The accuracy check.**
- Every step the host counted, when it finishes, reports its estimate against what it took (`StepQueue.finish()` → `EstimateOutcome`). A finished planned job adds a `job` row: the estimate when it was planned against the time from plan to last step.
- The host's `estimates` dep (`apps/control-app/src/estimates.ts`, wired in `ai.ts` over `env.DB`, so it works in a job's container too) writes them to the new `estimate_outcomes` table (migration 0050). It is one insert per batch, fire-and-forget, and never fails a turn.
- `GET /api/admin/estimates?business=…&from=…&to=…` is operator-only (404 otherwise). It returns per kind: n, mean estimated, mean actual, mean error and share late, over the last 30 days by default. Without `business` it covers every business.
- The console detail pane has a **Time estimates** section (`builder/estimates.js`) with a row per kind: estimated, took (± error), ran late.

## Design decisions made during implementation

- **No hand-off line.** Builder passes are detached (REQ-627): the round ends at `Delegate`'s `started` result and the model never reads it, so an estimate added there would be dead code. Before the consultant speaks, it reads (a) its rules' figures and (b) on a round the host started, the speak-first refusal. Both now carry the host's number.
- **Fix rounds are a mean per ordinary pass**, applied to each declared builder step. Measured chains ran 1–4 fix rounds. Summed over the dev chains, the formula landed near the slow end of what happened, which is the intent.
- **The survey's "stopped" test is the result's own `outcome`.** A loose "ran out of" pattern matched guidance text inside first-draft deliveries.
- A pass handed off after a *client* message isn't a fix round, even with faults outstanding. A client message clears owed faults on the host too (REQ-415).

## Supersedes (explicit)

REQ-625's estimate rules are replaced:
- "minutes is the median": now p80 plus fix rounds.
- "rounded to the nearest 5, under 5 is 'a few minutes'": now rounded up, never under 5.
- Step kinds `page`/`pages`/`many_pages`/`revision`: now `section`/`page`/`pages`/`site` plus the host's `fix_round`.
- The REQ-625 table and `consultant_minutes_per_step`: now `consultant {median, p80, n}`.

REQ-625's, REQ-390's, REQ-459's, BUG-298's and BUG-292's UATs are updated to the new figures (computed from the table, not pinned). The speak-first suites (BUG-262/278/284/290/292/298) now check that the refusal *contains* `SPEAK_FIRST_REFUSAL`, because the host's figure follows it.

## Test plan

- `tests/test_UAT_FC_BUG-360_the_survey_measures_step_times.test.ts`:
  - `1c estimates survey --local <fixture> --json` runs over a synthetic D1 (two container jobs with known step durations, plus a stopped, a refused and a lost pass and a run before `--since`). It reports the expected medians and 80th percentiles per kind, the fix-round count, the slow tool and the consultant's time, and counts what it left out.
  - `--write` makes the result the `measured` table and keeps unmeasured kinds' figures.
- `tests/test_UAT_FC_BUG-360_consultant_says_the_hosts_estimate.workers.test.ts`:
  - On a round the host started, the line the consultant receives before it speaks carries the estimate computed from the table: declared steps plus fix rounds, at the 80th percentile, rounded up. The rules carry the per-kind figures and no guessed time, and `fix_round` isn't declarable.
  - A finished job records its estimated and actual minutes per step and for the whole job, and `/api/admin/estimates` shows the error per kind, per business and across businesses.
- `tests/test_UAT_FC_BUG-360_console_shows_estimate_error.test.ts`: the console's Time estimates section shows each kind's estimate, what it took with the error, and the share late; it handles an empty period and a failed read.
- Regression: the related suites (92 workers files, 218 node files) were run in the branch worktree, and each failing file was run again on unchanged xgd-working.
  - Every failure but these was also failing on xgd-working.
  - REQ-459's "stopped" hand-off fails in the worktree even with this change swapped out (environmental); it passes in the main checkout.
  - Eight builder web-UI serving cases (REQ-115 shell, AC963–979, AC1038) fail only in the worktree. That is a known worktree-location effect, but it was not re-checked with the change swapped out.