---
uid: comment-c65ea3fb
id: COMMENT-783
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T18:32:55.794561+00:00'
updated_at: '2026-08-07T18:32:55.794561+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f119d7fc
  kind: note
---

**REPORT-1603** (`report-f119d7fc`) created — **FAIL**: 1 violation, 0 warnings, 0 needs_review.

## What I checked

All 4 stories in `capability-b4ac88fc` are `feature` kind, so all 35 ACs are in scope. Every one resolves to exactly one UAT via `test_UAT_AC<n>_*`, across four test files (2,234 lines). I read every AC body and every test body.

**Coverage** — clean. All 35 ACs have a substantive UAT. None is a structural/AST-only check; they drive the shipped `1c` launcher as a subprocess, `run(argv)`, the command handlers, exported validators, and a live builder origin over HTTP against real on-disk trees.

**Exclusivity** — clean. No two UATs verify the same scenario in the same shape.

**Consistency** — one violation.

## The violation

AC-941 requires the retrofit to report *"the list of files it wrote"*, and its Verification directs asserting that *"every file named in the report"* changed. The UAT asserts only the count string `wrote N file(s)`, then derives the file list from the filesystem via `pageFiles(siteDir)` — it never reads a filename out of the report.

The clause isn't satisfied in either output surface: `formatAssign` emits a bare count (`tools/generate/src/cli/colors.ts:518`) and `--json` emits the palette alone. The data exists — `cmdColorsAssign` returns `written: [...pages, 'site.json']` (`colors.ts:503`) — only the renderer drops it. I gave the editor two repairs and recommended the code-side one, since the story body is silent on the file list and AC-941 is the sole origin of the claim.

## Two things worth flagging to you

**A near-miss false positive.** The census UATs pin `#2e86a3` at three opacities in the real stored `xgd` site. Grepping the site found that literal exactly once and no 8-digit variants — which looked like a dead fixture. It isn't: `xgd` is already retrofitted, so the alphas ride on `primary` references as 255/166/85. That's precisely what makes AC-947's "references are measured as the colours they resolve to" a live claim. I confirmed before filing rather than after.

**One environmental caveat.** AC-871 is the only conditionally-executed test in the capability (`it.runIf(browserOk)`). Its AC explicitly sanctions the gate and Playwright's chromium is installed here, so it does run — but in a browser-less environment that AC would have no executing evidence.

I did not run the suites: the colour tests write into `storage/sandbox/`, and the check is specified read-only. The findings above rest on reading the ACs, the tests, and the production code they exercise.
