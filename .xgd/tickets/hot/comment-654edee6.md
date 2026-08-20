---
uid: comment-654edee6
id: COMMENT-1225
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T02:43:33.393590+00:00'
updated_at: '2026-08-20T02:43:33.393590+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6d49b369
  kind: note
---

**Result: PASS** — REPORT-2324 (`report-6d49b369`), 0 violations / 1 warning / 0 needs_review.

The fix cycle (`ded80daa8`) closed both violations from my prior report. I re-verified each against source rather than the fix report's word:

- **AC-1240** now has `test_UAT_AC1240_…` (origin:202-278). Its load-bearing assertion is `served === derived`, and I confirmed the test's derivation is byte-for-byte the shipped one — `ts.transpileModule` at ES2022/ESNext plus the `@1stcontact/site-schema` rewrite is exactly `transpileForBrowser` at `tools/generate/src/cli/builder.ts:123-135`, serving the route matched at `:462-468`. So the equality is anchored to shipped code, not a guess at it.
- **AC-966** was genuinely rewritten this time, not re-commented: the `dist` byte-comparison is gone, the address comes from the workspace's own `previewUrl`, references are parsed out of the returned document, and the never-rendered-to-disk guard runs with a non-vacuity assertion.
- **AC-973** now drags via real pointer events and asserts the rail as rendered. I ran that file: **9/9 pass**.

All 31 criteria now carry at least one `test_UAT_AC<n>_*`, and no test was lost in the rewrites. The fix changed only two test files — no ticket body or field moved, so the ac-level PASS above this one still stands on the text it was issued against.

Two things worth your attention:

**I could not execute the origin suite, and reproduced why.** `tests/reconciliation-builder-workspace-origin.test.ts` aborts in `beforeAll` with `listen EPERM` on both `0.0.0.0` and `127.0.0.1` at `builder.ts:623` — this sandbox permits no `listen`. That blocks eleven CAP-85 UATs, nine of them untouched and previously green, so it is environmental and pre-existing rather than anything this cycle introduced. Alignment is answerable by reading each test against its criterion, which is what I did; **whether that evidence passes is the `uat_coverage_check`'s question, and it needs a machine that can bind a local port.** I recorded that as info 3 so a downstream pass doesn't read this PASS as "the origin suite is green."

**The one warning is a residue the fix introduced.** AC-973's test patches `HTMLElement.prototype.getBoundingClientRect` globally to give jsdom a box. It's declared, restored in a `finally`, and leaks nowhere — but because every element reports the same 1000px width, the test can't distinguish the component reducing the drag against its container from against the divider or the body. Fix is small (own-property override on `app.split.element` instead of the prototype) and doesn't gate.
