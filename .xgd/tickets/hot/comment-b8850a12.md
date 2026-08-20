---
uid: comment-b8850a12
id: COMMENT-1262
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T05:06:13.372725+00:00'
updated_at: '2026-08-20T05:06:13.372725+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3198a7b5
  kind: note
---

Attempt 7 complete — 7 of 17 findings closed, report `report-3198a7b5` filed.

## What I did

**Group A (the report's stated priority — the silent-failure blind spots):**
- **AC-1307 / AC-1308** — new `tests/req72-gradient-capture.test.ts`. Seven UATs drive the real `EXTRACT_SCRIPT` under the BUG-15 jsdom harness: gradient stops hexified on both captured declarations, direction and stop offsets untouched, hex/non-gradient pass-through; and one UAT per rule of the surface-gradient ancestor walk (nearest wins, text-fill skipped, stop at first opaque solid, none records none). All pass headlessly.
- **AC-1285** — two UATs pinning the reversibility property itself: the same stored bundle re-reported with the axis dial widened and then turned back, with both sides' captured extents re-read off disk and asserted unchanged.

**Group B:** extended AC-638's test with the two rejections it omitted (palette-role stop, bad direction); renamed the orphaned `test_UAT_AC637_…` to AC-1309 and extended it to the full criterion.

**Group C (started):** ported the two ACs whose FC evidence is browser-independent — AC-1311 (6 tests) and AC-1315 (3 tests).

34 passed / 4 skipped across every touched file; `naming.test.ts` clean after the renames.

## Two things you should know

**One AC bullet was wrong, so I corrected it rather than testing absent behaviour.** AC-1307 claimed a pre-resolution bundle "raises no delta rather than a false one." `gradientsMatch` (`values-diff.ts:1657`) fails on any stop-count mismatch and there is no empty-stop guard anywhere — so a stale bundle *does* raise a delta. That is precisely the symptom REQ-72 was raised to fix, and its stated remedy is re-capture. I replaced that bullet with the intent-faithful statement; every other bullet is now covered.

**No Chromium in this runner.** That shaped the design — AC-1308's four rules and AC-1307's non-oklch half run headlessly, so neither AC reports covered while contributing nothing. But the one case that genuinely needs a real engine, `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` and its `gradient-oklch.html` fixture, was **authored but not executed here**. It mirrors a passing sibling and shares its fixture server, but a Chromium-provisioned runner should confirm it. I've recorded it as unverified rather than counting it as a pass.

Ten findings remain, all mechanical Group C ports; three of them (AC-1310/1314/1316) carry the W1 browser-gating trap and will get the same treatment applied here.
