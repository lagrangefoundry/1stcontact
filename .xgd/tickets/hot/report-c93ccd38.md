---
uid: report-c93ccd38
id: REPORT-11596
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T22:24:28.229223+00:00'
updated_at: '2026-11-08T22:24:28.229223+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-58b2cec4
  parent_report_uid: report-8f9f5514
  batch_index: '1'
---

I made no edits. The one failing test is AC2479, and both of its failures are defects in production code. The code is frozen in this pass, so this batch is blocked until an exception lifts that rule.

**What I ran:** `npx vitest run tests/reconciliation-assistant-drives-the-draft.test.ts`. 5 of 6 tests passed, so AC2477, 2478, 2480, 2481 and 2482 already pass as they stand. AC2479 failed with four soft assertions, which come from the two defects the planner named:

1. **A field can be reached by its id or name attribute.** `fill "email_input" with "a@b.c"` took a picture instead of refusing. The refusal text was missing and one picture was taken where none should be. The cause is `fillNames` in `tools/generate/src/cli/capture/interact.ts` at lines 204–205, which adds `el.getAttribute('name')` and `el.id` to the names a field can match.
2. **An option's value can beat its words.** `fill "Region" with "United Kingdom"` left the menu reading `"United Kingdom"`, the value of the "Elsewhere" option, when it should read `"GB"`. The cause is lines 282–284 of the same file, which take the first option whose words *or* value match, in a single pass.

The test and AC-2479 match REQ-216 ("there is no way to name a selector, an id or an attribute"; option words first, value only as a fallback), so I have left both alone.

## Assessment
```yaml
blocked_by:
  rule: code_frozen
  evidence: "vitest run of tests/reconciliation-assistant-drives-the-draft.test.ts: 5/6 pass, test_UAT_AC2479 fails with 4 soft assertions. (a) fill \"email_input\" returned a picture, not INTERACTION_FAILED; shutters [[]] where [] was expected. Cause: interact.ts:204-205 fillNames pushes getAttribute('name') and el.id. (b) Region menu reads 'United Kingdom' where 'GB' was expected. Cause: interact.ts:282-284 matches option text OR value in one pass, so the earlier option value='United Kingdom' wins. Test and AC-2479 follow REQ-216 and are correct; the fix is production-only."
  proposed_change: "tools/generate/src/cli/capture/interact.ts: (1) delete lines 204-205 (`v=el.getAttribute('name');if(v)out.push(v);` and `if(el.id)out.push(el.id);`) from fillNames. (2) Replace the single-pass option loop at 282-284 with two passes: first `for(...) if(norm(opt.textContent)===want){chosen=oi;break}`, then only `if(chosen<0) for(...) if(norm(opt.value)===want){chosen=oi;break}`. No test or AC changes."
```