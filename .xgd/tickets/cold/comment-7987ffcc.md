---
uid: comment-7987ffcc
id: COMMENT-682
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T23:07:25.712584+00:00'
updated_at: '2026-08-05T23:07:25.712584+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a85d40c2
  kind: note
---

**REPORT-1328 (`report-a85d40c2`) — FAIL: 3 violations, 3 warnings, 0 needs_review.**

## What I checked

All 37 active ACs across the five stories of CAP-63. **Coverage is complete** — every AC carries a `test_UAT_AC<n>_*` test, and all 37 execute and pass (verified by running the eight AC-bearing files, plus the two extra files holding AC-637/738/739). Exclusivity is clean: the only AC with two tests (AC-711) has them covering genuinely different legs — the diff axes vs. the painted-marker capture precondition.

## The failure is consistency, not coverage

All three violations are one pattern: **the UAT drops a level below the command its AC names and tests the seam instead**, leaving the wiring between CLI and seam unguarded. In each case the unexercised code is a single live line:

| AC | What's untested | Line that could be deleted with the suite still green |
|---|---|---|
| **AC-657** | The test never runs `values-diff --json` — it calls `withCleanStdout`, writes the JSON document itself, then parses what it wrote. Nothing anywhere invokes `run(['values-diff', …, '--json'])`. | `cli/index.ts:491` |
| **AC-643** | Passes `actualImagePath`, taking `cmdDiff`'s shoot-the-reproduction branch out of play — so `--size` reaching the shot is unasserted, though the AC's Verification names it explicitly. | `perceptual.ts:467` |
| **AC-720** | The AC's end-to-end clause (non-empty crop pairs from a sandbox build) is declared **manual** in the test file's own docstring. | the `subRenderOptions` → render/serve handoff |

Warnings: AC-658 and AC-639 are the same shape one degree weaker (AC-639's Verification doesn't demand the clause its Criterion states); AC-631's capture leg is delegated to a **browser-gated** sibling, so where Chromium is absent it has no executing evidence.

## Two notes for whoever picks this up

- **Two fixes cover four findings** — AC-643/AC-639 are the same edit on the two size-aware commands; AC-657/AC-658 are the same edit on the values-diff CLI path. Every ingredient already exists in the repo (`MarkerScreenshotDriver`, `shot.test.ts:133`, the byte-level stdout harness, the `runCli` harness). No new infrastructure, nothing needs to become browser-dependent.
- **STORY-78 is the model** — all nine of its UATs drive `run(argv)` and assert on real stdout/exit codes, and it's the only story here with zero findings. The pure diff-engine UATs (AC-629…636, AC-711…715) are also exemplary and should not change.

One thing worth flagging beyond my level: the two AC-level violations from `report-728bd245` are **still unrepaired** (AC-637 still titled for the deleted `text-block` module; STORY-76 still has no capture-leg AC) despite `check_ac_validation` having committed as done. Finding 6 is the same underlying gap and is most efficiently fixed alongside them.
