---
uid: report-e4f1162d
id: REPORT-11597
type: report
title: 'Report: blocked_by_handoff for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T22:24:33.782992+00:00'
updated_at: '2026-11-08T22:24:33.782992+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-58b2cec4
  rule: code_frozen
  evidence: 'vitest run of tests/reconciliation-assistant-drives-the-draft.test.ts:
    5/6 pass, test_UAT_AC2479 fails with 4 soft assertions. (a) fill "email_input"
    returned a picture, not INTERACTION_FAILED; shutters [[]] where [] was expected.
    Cause: interact.ts:204-205 fillNames pushes getAttribute(''name'') and el.id.
    (b) Region menu reads ''United Kingdom'' where ''GB'' was expected. Cause: interact.ts:282-284
    matches option text OR value in one pass, so the earlier option value=''United
    Kingdom'' wins. Test and AC-2479 follow REQ-216 and are correct; the fix is production-only.'
  proposed_change: 'tools/generate/src/cli/capture/interact.ts: (1) delete lines 204-205
    (`v=el.getAttribute(''name'');if(v)out.push(v);` and `if(el.id)out.push(el.id);`)
    from fillNames. (2) Replace the single-pass option loop at 282-284 with two passes:
    first `for(...) if(norm(opt.textContent)===want){chosen=oi;break}`, then only
    `if(chosen<0) for(...) if(norm(opt.value)===want){chosen=oi;break}`. No test or
    AC changes.'
  batch_index: 1
  parent_report_uid: report-8f9f5514
  anchor_ticket: bundle-7ba3af93
---

# Builder blocked by `code_frozen`

**Evidence**: vitest run of tests/reconciliation-assistant-drives-the-draft.test.ts: 5/6 pass, test_UAT_AC2479 fails with 4 soft assertions. (a) fill "email_input" returned a picture, not INTERACTION_FAILED; shutters [[]] where [] was expected. Cause: interact.ts:204-205 fillNames pushes getAttribute('name') and el.id. (b) Region menu reads 'United Kingdom' where 'GB' was expected. Cause: interact.ts:282-284 matches option text OR value in one pass, so the earlier option value='United Kingdom' wins. Test and AC-2479 follow REQ-216 and are correct; the fix is production-only.

**Proposed change**: tools/generate/src/cli/capture/interact.ts: (1) delete lines 204-205 (`v=el.getAttribute('name');if(v)out.push(v);` and `if(el.id)out.push(el.id);`) from fillNames. (2) Replace the single-pass option loop at 282-284 with two passes: first `for(...) if(norm(opt.textContent)===want){chosen=oi;break}`, then only `if(chosen<0) for(...) if(norm(opt.value)===want){chosen=oi;break}`. No test or AC changes.
