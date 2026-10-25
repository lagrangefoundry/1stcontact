---
uid: bug-bf35e88c
id: BUG-253
type: bug
title: 'ReportResult: a refused report is resent until the builder''s context runs
  out'
created_by: EPIC-20
created_at: '2026-10-22T23:09:04.845607+00:00'
updated_at: '2026-10-23T00:46:53.230335+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-aadf8f66
  commits:
  - working_sha: 78b0a002be0d353a930fff9a7f782570f9b381bb
    reconcile_sha: null
    main_sha: null
  - working_sha: 56db6b8894f8b0243aeda1a27206dd1a44372aa7
    reconcile_sha: null
    main_sha: null
  version: 0.2.586
  story_points: 2
---

## Symptom

On Ariel's Arc Welding, builder `worker-builder-7-f6ol9f` sent the same refused ReportResult **49 times in a row** (`unasked_check`). It used up its context (~152k tokens), never delivered a report, cost $1.08, and its work was then redone by `worker-builder-8-yjpk74`. Across the session, 82 ReportResult calls were refused with `unasked_check`, and 60 of those had `<item>` markup inside the string parameter instead of a JSON list of strings.

BUG-243 (a builder's turn ends once its report is *recorded*) is confirmed working: no run made any call after an accepted report. This is the remaining case, a report that is *refused*.

## Fix

1. When ReportResult refuses because the checks were passed as markup (e.g. `<item>…</item>` inside a string), the error says so plainly: "pass the checks as a JSON array of strings, not markup".
2. After the same refusal three times in a row, the host records the report it has (with the refused checks marked unreported) and ends the builder's turn, so the run's work reaches the consultant instead of being lost.

## What landed

All host-side (the refusal itself is the framework's `unasked_check`; nothing upstream changed).

- `account-core.ts`: `REPORT_MARKUP_HINT`, `reportMarkup(input)` (a paired tag like `<item>…</item>` in any string of `passed`/`failed`/`changed`/`decisions`, or a lone string in their place), `REPORT_REFUSAL_LIMIT = 3`, and `reportAsItStands(input, asked)` — the report with every `passed` entry that pairs with no asked check dropped (same case/space/trailing-full-stop normalisation the framework pairs by).
- `host-core.ts` `runTool`: a refused report carrying markup gets the markup hint *before* the existing BUG-212 shape hint. Refusals are counted per worker toolbox (one per builder session, held in a WeakMap); a run is "the same refusal" when the refusal text is identical, and any other tool call or a recorded report resets it. On the third identical refusal in a row the host re-sends the report as it stands; the framework records it, its reconcile reports the dropped checks as `unreported`, and BUG-243's `finish` ends the turn. Summary, `changed`, `decisions` and `failed` are kept. If even that is refused, the refusal goes back to the builder as before.
- The asked checks come from the delegation runtime's pending slot for the worker's session, passed into `toolSet` as an `asked` getter by the builder's `build` callback only — the consultant's tools are unaffected.

## Test plan

`tests/test_UAT_FC_BUG-253_a_refused_report_is_not_resent_forever.workers.test.ts` (real `/api/ai/prompt` route in workerd, scripted Anthropic client):
- UAT: a ReportResult whose `passed` is one string of `<item>` markup is refused with an error naming the expected JSON-array shape.
- UAT: a scripted builder that repeats the same markup report keeps sending for exactly three requests; the consultant receives `outcome: reported` with the summary and `changed` intact and both asked checks `unreported`.
- UAT: a builder that corrects its report on the third try (after two refusals) has its real passes recorded as `passed` — the forced record only applies to an identical refusal.

Regression scope: BUG-243, BUG-208, BUG-212, BUG-225, BUG-145, BUG-167, REQ-295, REQ-339, REQ-340, REQ-354, REQ-409, REQ-410, REQ-411, REQ-421, REQ-427 suites — all green except two REQ-295 tests that fail identically on the base without this change (pre-existing).