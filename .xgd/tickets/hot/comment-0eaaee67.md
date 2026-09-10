---
uid: comment-0eaaee67
id: COMMENT-2530
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T12:34:07.552053+00:00'
updated_at: '2026-09-10T12:34:07.552053+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-96284e49
  kind: note
---

**REPORT-3731 (`report-96284e49`) — FAIL: 2 violations, 5 warnings, 0 needs_review.**

**Scope:** 7 stories, 108 ACs (105 active, 3 pending). Every one of the 105 active ACs has at least one `test_UAT_AC<n>_*` definition — coverage is complete by count. Both violations are cases where a green test overstates what it proved.

**I was able to run the suite this cycle** (the last two uat cycles could not), which turned the oldest carried finding from an argument into a measurement.

**Violations**
1. **AC-685 vs `render.ts`** — 5th consecutive cycle. The AC claims the emitter re-derives closed-enum axes as a last line of defence; eight sites (`render.ts:230, 627, 679, 2037, 2038, 2041, 2051, 2134`) still interpolate the instance value raw, `cssEnum` has 0 hits, and neither AC-685 test carries an enum payload. DOC-2 §2 sides with the code — the AC over-claims. Needs an operator decision (`ac-edit` to narrow, or accept `code-issue` and add the guard) **before** any test edit.
2. **AC-1012's UAT silently passes its unrun arm** — I ran `reconciliation-nowrap-width-floor`: `4 passed (4) … tests 14ms`, zero skipped. Chromium is unavailable here, so the `if (!HAVE_CHROMIUM) return` at `:460` returned and the AC's actual criterion (measured bounding boxes at each ladder width) never executed. The sibling file reports `6 passed | 2 skipped` under the identical absence because AC-683/688 use `it.runIf`. Separately, the AC's round-trip-fidelity clause is exercised by no arm at all — the fixture is synthetic, with no capture to compare against.

**Warnings:** the same silent gate at AC-1009/AC-1011 (their engine-free arms are substantive); AC-702's internal `vi.doMock` — plus a new sub-defect, the `afterEach` unmocks `…/src/index` while the mock is on `…/src/worker`, so it is never torn down; AC-930 duplicating STORY-97's AC-942; AC-686/687 ¶2 attribution gaps (proven by AC-849, not by their own tests); and one new small gap where AC-718's rewritten Verification asks for the `form` slot's `required` flag that the test doesn't assert.

**Closed this cycle:** the prior report's AC-718 finding (the test had moved past its AC) and the AC-723 repair both verify clean at the evidence layer. The five new active ACs (AC-1144/1145, AC-1412/1413/1414) are all substantive with real entry points.

**Disclosed, not counted as findings:** `test_UAT_AC703_*`, `test_UAT_AC888_*` and the entire workers project fail or won't start on `listen EPERM` — the sandbox refuses socket binds. All three tests are correctly written; they need a runner with bind permission.
