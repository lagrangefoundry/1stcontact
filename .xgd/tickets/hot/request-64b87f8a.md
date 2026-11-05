---
uid: request-64b87f8a
id: REQ-625
type: request
title: 'Build timings: analyse past runs to give measured estimates and step-count
  progress'
created_by: EPIC-19
created_at: '2026-11-01T00:38:29.787532+00:00'
updated_at: '2026-11-01T17:54:10.797351+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-28cbfc8c
  commits:
  - working_sha: 87100759d3a251a1797de0b0ade3d1a8a4ac2d13
    reconcile_sha: null
    main_sha: null
  - working_sha: 00acb7f77bd6a29fa5a2c7d4a4352f99f90e19c0
    reconcile_sha: null
    main_sha: null
  version: 0.2.728
  story_points: 5
---

## Why

Operator, 2026-10-31: the client keeps seeing "another 15 minutes"; "We need better estimates and progress — a real progress bar would be good but I don't think we are ready for it." Today's estimates are guesses: the consultant writes its own ("about 15 minutes"), and `slow-tools.json` says of its `minutes` values "The numbers are estimates to tune, not measurements". "We have quite a lot of data from all the runs we have done" — use it.

## What

1. **Analyse the runs we have** and write the findings into this ticket (or a linked doc):
   - Sources: production D1 (`turn_log`, `turn_spend`, `request_spend` with `sent_at`/`recorded_at` per request and `delegated_by`), the `tool_transcript` comments on chat tickets (every tool call's `ts`, so Delegate start → its result), local dev miniflare D1 and junctions (see the dev-store forensics notes), and Workers Logs for kills.
   - For each kind of work: first draft end to end; a builder pass by scope (one section, one page, several pages); revision rounds; critique runs; image and clip generation (CreateImage, EditImage, AnimateImage); capture_site; screenshot. Give count, median, p80 and spread, and what predicts duration (pages in scope, sections, words in the brief, number of checks).
   - Separate time lost to kills and repeats (lost turns, duplicated Delegates) from real work, so estimates are of the work, not of the failures.
   - Per site, the timeline of the first draft and of refinement split into client-requested work vs AI-initiated work (as done by hand for Ariel on 2026-10-31: ~8 client requests vs 53 Delegates).
2. **Turn it into an estimate model** the host can use: a table of measured durations per step kind (replacing `slow-tools.json`'s guessed `minutes` with measured values) and a rule for a job's estimate from its queued steps.
3. **Step-count progress, now:** the progress line the client sees counts steps from the job's queue ("Building pages: 2 of 6 done, about 25 minutes left") and updates as each step finishes; the consultant quotes the host's estimate instead of inventing one, and doesn't restate the same estimate each round. A real progress bar is out of scope.

## Test plan

- The analysis (tables, method, queries) is recorded on this ticket before code changes.
- `test_UAT_FC_<id>_estimate_from_measured_table`: a job of N queued builder steps of known kinds gets an estimate equal to the table's sum, and the progress line shows "k of N done" as steps complete.
- `test_UAT_FC_<id>_consultant_quotes_host_estimate`: the consultant's priming/agenda gives it the host's estimate for the queued job, and the slow-tools table carries measured values with their source noted.

## Analysis (2026-11-01, before any code)

**Sources read (all read-only).** Remote D1 (dev and production share one database): `request_spend` (1,553 rows, from 2026-10-28), `turn_log` (96), 61 `tool_transcript` and 104 `chat_transcript` comments. Local dev miniflare D1 (runs before 10-28): ~3,200 `request_spend` rows, 426 transcripts. Builder rows before 2026-10-25 (haiku-4-5) have no `sent_at`, so measured passes are the haiku-5-5 era only — which is the current builder. Kills: REQ-624 already lists the Workers Logs kills on Ariel (six `exceededMemory`, 10-31); here they show up as `turn_log.outcome = lost` (29 turns) and as passes that never returned. Script: the `req625-analyse.py` comment on this ticket.

**Method.**
- *Builder / critic pass* = one `request_spend.turn_id` with `delegated_by` set: last `recorded_at` − first `sent_at`. Matched to its `Delegate` call in the tool transcript (same consultant turn, nearest end) to get `scope`, `accept` (checks) and `goal` (brief words). 137 passes matched.
- *Consultant slow tool* = the transcript `ts` (written when the result returns) − the end of the consultant request that issued it. Only calls that were the sole slow call of their batch, so parallel calls don't blur it.
- *Repeat* = a returned Delegate whose brief is ≥85% the same as one in the same chat within 3 h. *Lost* = a pass whose consultant turn ended `lost`/`stalled`/`restarted` and that never returned a result. *Stopped* = returned, but stopped or out of budget. Estimates below exclude all three.

**Builder passes, by scope (minutes, clean passes):**

| kind | n | median | p80 | p90 |
|---|---|---|---|---|
| one page | 53 | 1.4 | 2.6 | 3.7 |
| 2–3 pages | 29 | 3.1 | 4.4 | 4.7 |
| 4+ pages | 9 | 5.0 | 5.2 | 6.0 |
| no scope given | 7 | 4.5 | 6.4 | 6.4 |
| revision (same scope re-delegated within 30 min) | 21 | 1.3 | 2.3 | 2.6 |
| first pass at a scope | 77 | 2.9 | 4.7 | 5.2 |
| critic pass (the model inside `critique`) | 14 | 1.1 | 1.2 | 1.2 |
| consultant's own time between consecutive passes | 86 | 1.6 | 3.0 | 6.8 |

**What predicts a builder pass's duration** (correlation with minutes, n=98): pages in scope 0.36, words in the brief 0.29, checks 0.17. Brief length by bucket: <200 words 1.2 min median, 200–499 2.4, 500–999 4.3. Checks: 0–3 1.2, 4–6 2.3, 7–10 3.5. The only strong predictor is the number of builder requests (0.83), which isn't known before the pass runs. So **scope (pages) plus first-pass vs revision** is the usable rule; brief length is a weaker second signal.

**Consultant slow tools (seconds, sole call in its batch):**

| tool | n | median | p80 | max | `slow-tools.json` today |
|---|---|---|---|---|---|
| screenshot | 102 | 3.7 | 8.2 | 13.6 | 1 min |
| compare | 4 | 3.6 | 3.7 | 6.6 | 1 min |
| capture_site | 4 | 53 | 76 | 179 | 5 min |
| CreateImage | 1 | 60 | 60 | 60 | 1 min |
| EditImage | 5 | 70 | 79 | 83 | 1 min |
| AnimateImage | 3 (+2 failed, one at 420 s) | 137 | 230 | 420 | 5 min |
| critique | 17 | 78 | 94 | 152 | — (not listed) |
| import_from_site | 0 measured | | | | 1 min |

Screenshot and compare finish well inside 20 seconds — by `slow-tools.json`'s own rule they don't belong in it. `critique` takes ~1.5 minutes and isn't listed.

**First draft, end to end** (8 sites with a hand-over link `](#show=draft`): first builder pass → hand-over median 12.5 min, p80 18 min; 4 Delegates median (2–7). Measured from the client's first message it is dominated by the conversation before building (Ariel 10-31: 93 min; Dina first-draft-test copies inherit days-old first messages, so that figure isn't meaningful there).

**Time lost to kills and repeats** (measured era): 11 lost passes, 29.5 builder-minutes; 12 repeat Delegates, 45.5 builder-minutes; 28 stopped passes (median 1.1 min). On Ariel 10-31 alone: 4 detected repeats and 100 builder-minutes of refinement.

**Per-site refinement (after the hand-over): client messages vs Delegates.**

| site (chat) | client msgs | Delegates | on host cues | repeats | builder min |
|---|---|---|---|---|---|
| Ariel's Arc Welding 10-31 (chat-db225a61) | 19 | 61 | 21 | 4 | 100 |
| site_c4bed79a 10-28 (chat-5857a4f0) | 28 | 39 | 7 | 2 | 40 |
| Ariel's Arc Welding 10-22 (chat-b756ba9a) | 51 | 84 | 7 | 0 | (pre-`sent_at`) |
| Dina's Diner test copies (6 chats) | 0–7 each | 2–25 each | 2–20 each | 0–2 | 8–46 |

"Client msgs" counts every message, including "ok"; the operator's hand count for Ariel 10-31 was ~8 *requests* against 53 Delegates. Either way, Delegates outnumber client messages 3:1, and a third of Ariel's came on host cues (AI-initiated).

**What this means for the estimate model.**
1. A builder step's estimate comes from its scope: one page ≈ 1.5 min, 2–3 pages ≈ 3 min, 4+ pages ≈ 5 min, a revision ≈ 1.5 min, plus ~1.5 min of the consultant's own checking per step. The p80 is roughly 1.5–2× the median.
2. A job's "minutes left" = sum of the remaining steps' medians + per-step consultant time. Summing p80s would overstate it badly, since not every step is slow.
3. The slow-tool `minutes` should be the measured values: CreateImage/EditImage 1, capture_site 1 (5 at worst), AnimateImage 3–4, critique 2. Screenshot and compare drop out.
4. Measured, a first draft is ~4 passes and 12–18 minutes once building starts. That is well under the "another 15 minutes" the client keeps hearing per round, so the complaint is about repeated restated guesses during refinement, not first-draft length.

## Decisions (operator, via EPIC-19, 2026-11-01)

Answers to the four questions raised after the analysis:

1. **Don't wait for REQ-624: the consultant declares the planned steps up front.** When it starts a piece of work it states the steps (each page or section and its kind: first pass or revision, and any slow tool such as AnimateImage), the host holds that list, counts "k of N done" as passes return, and computes "about N minutes left" from the measured table. The consultant can add or drop a step as plans change, and the line updates. Build it so that REQ-624/REQ-627's durable job takes over the same list later (one list, not two mechanisms).
2. **Estimate rule: agreed.** Sum of the remaining steps' medians plus about 1.5 minutes of consultant time per step, rounded to the nearest 5 minutes. Never "0 minutes": under 5 reads as "a few minutes". The line changes only when a step finishes or the plan changes, and the consultant doesn't restate an unchanged estimate.
3. **The 1/5/30-minute rule goes.** `slow-tools.json` carries rounded measured values, with a note of where they came from (this analysis, its date and n), so they can be re-measured with the script in COMMENT-6230.
4. **Screenshot and compare come out of `slow-tools.json`; critique goes in (about 1.5 minutes): agreed.** They finish in seconds, inside the file's own 20-second threshold, so no status line and no speak-first refusal for them is right.

Noted from the analysis: once building starts, a first draft is about 4 passes and 12–18 minutes. The client's sense of slowness comes from failures, repeats and restated guesses (BUG-320/324, REQ-623/624/627), not from the building itself.

## What changed (implementation, 2026-11-01)

**The measured table.** `tools/generate/src/cli/ai/slow-tools.json` now carries measured medians, not guesses. Each entry has `minutes` and the run count `n`, and `measured` notes the source ("REQ-625 analysis, 2026-11-01 …", re-measure with COMMENT-6230's script).
- Builder step kinds (`steps`): `page` 1.4, `pages` (2–3) 3.1, `many_pages` (4+) 5.0, `revision` 1.3. Plus `consultant_minutes_per_step` 1.5.
- Slow tools: capture_site 0.9, critique 1.3 (new: status line and speak-first gate like any slow tool), CreateImage 1.0, EditImage 1.2, AnimateImage 2.3, import_from_site 1.0 (not measured, n 0).
- **Screenshot and compare are no longer slow tools**: no status line and no speak-first refusal. The 1/5/30 check is gone; a tool without measured minutes fails at load (fails a deploy).

**The estimate model** (`tools/generate/src/cli/ai/estimate-core.ts`). A job's time left = sum over the steps not yet done of (kind median + 1.5 min). Shown rounded to the nearest 5 minutes, and under 5 reads "a few minutes", never "0 minutes". The line reads "k of N done, about M minutes left"; a one-step job reads "about M minutes left" alone.

**The consultant declares the steps.** `Delegate` gains an optional `steps` parameter: one step per line as `kind: what`, this one first, the kind one of the table's kinds or a slow tool's name. Its description lists each kind's measured minutes, so what the consultant says before the work agrees with what the host will show. A string rather than an array, because array parameters through the surface are fragile.
- A later `Delegate` that gives `steps` again replaces the steps not yet done, so a plan grows or shrinks.
- A `Delegate` with no plan pending is counted as an unplanned step of the kind its `scope` implies (1 page / 2–3 / 4+). So a lone pass still gets the host's estimate.
- A slow tool call is a step only when the plan has a pending step of its kind.

**The host holds the list** per site (`stepQueues` in `host-core.ts`, keyed like the working note), so it outlives the round and the request a step began in. A step is counted done when its pass or tool returns, and the queue empties when every step is done. A new client message (not a host cue) starts the count afresh. One list, meant to be what REQ-624/REQ-627's durable job takes over.

**What the client sees.** Every working note carries the progress, so the status line reads "The consultant is building your home page now — 1 of 3 done, about 5 minutes left", and `eta_s` is the time left in seconds. When a step finishes, the same line is restated with the new count; the next step's note carries it on. It changes only when a step finishes or the plan changes. A slow tool outside a plan shows its own measured time (e.g. capture_site's `eta_s` is 54, not 300). The host's stand-in line ([[BUG-292]]/[[BUG-298]]) adds the same figure.

**What the consultant is told.**
- The `note` parameter now asks for what is being built and **no time** ("the host adds how long from `steps`").
- While planned work is under way, each consultant request carries the host's figure as a per-request notice: "The work under way: 1 of 3 done, about 5 minutes left (the host's estimate …). If you mention how long, use this figure, and do not repeat an estimate you have already given unless it changed."
- Priming: the `delegation-method` paragraph tells it to list the work in `steps` on the first hand-off. Rule 8 now says a first draft takes about 15–20 minutes once building starts (it said a guessed 30–45), and to quote the host's estimate without repeating one already given.

**Design decisions made while building.**
- The plan rides on `Delegate` rather than a new tool: no new surface, and a plan change is restated on the hand-off it changes.
- Estimates use medians, not p80s: the analysis showed summing p80s overstates the total.
- An unplanned `Delegate` is still counted (from its scope), so the host always has an estimate rather than none.

## Test plan (as built)

- `tests/test_UAT_FC_REQ-625_measured_estimates_and_step_progress.workers.test.ts`, through the Worker's real `/api/ai/prompt` route (only the model client is faked):
  - `test_UAT_FC_REQ-625_estimate_from_measured_table`: a job of 3 declared steps (`page`, `pages`, `revision`). The first status's `eta_s` equals the table's sum (medians + consultant time) in seconds. The status lines read, in order, "0 of 3 done", "1 of 3 done" (restated when the first pass returns), carried on by the second pass's note, "2 of 3 done", and so on. Times are rounded to the nearest 5 and never "0 minutes".
  - `test_UAT_FC_REQ-625_consultant_quotes_host_estimate`: the `Delegate` declaration has `steps` listing every measured kind, and `note` says "No time in it". The consultant's request after the first step returns carries "The work under way: 1 of 3 done, …" and the don't-repeat instruction. Priming no longer says 30–45 minutes and mentions the host's estimate. Every table entry has positive minutes and an integer `n`, `measured` names this analysis and its date, screenshot and compare are not slow tools, and critique is.
- **Existing tests changed by this ticket's decisions** (explicit supersession, decisions 3 and 4):
  - Screenshot is no longer slow, so the speak-first gate tests now use `capture_site` on a private address (refused at once by its own guard) as their slow call: BUG-262, BUG-290 (two cases), BUG-292, BUG-298 (comparison-board case).
  - Measured ETAs replace the guessed 300 s in REQ-386, REQ-390 and BUG-257.
  - The host's "… left" figure is now part of the status / stand-in line in REQ-390, REQ-459 and BUG-298 (the reissued-Delegate case).
  - REQ-386's `every_listed_slow_tool_estimates_one_five_or_thirty_minutes` is **deleted**: the 1/5/30 rule is gone, and REQ-625's own UAT pins the measured table instead.
  - REQ-386's `the_consultant_is_told_the_20_second_rule_every_turn` already fails on a clean xgd-working (its reminder text changed earlier). It also asserts the retired 1/5/30 wording; left as found.