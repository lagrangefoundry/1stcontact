---
uid: comment-f26c902b
id: COMMENT-7982
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T08:15:38.115807+00:00'
updated_at: '2026-11-08T08:15:38.115807+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-02c0f7a4
  kind: note
---

I filed the iteration-3 fix plan as **REPORT-11355** (`report-02c0f7a4`), result `pass`. It now rules on the builder's `code_frozen` report, which the previous attempt (REPORT-11354) left out and validation refused it for.

- **Ruling: declined.** The builder's report (REPORT-11353) asked for no wider permission and proposed no change. Its one open item was the REQ-209 font-metrics test, marked "fixed, unverified" because its sandbox couldn't launch a browser. The scoped gate run REPORT-11348 has since verified it: that run was at commit `11e05a2224`, which includes the builder's fix `a5a337c47c`, and the test passed with 0 failed and 0 skipped, so a real browser ran it. No production code is needed, so the code freeze stands and the batch edits no files.
- **One batch, verify-only.** It holds the six tests from the iteration-2 batch: the two orphaned ACs (AC-1817, AC-1818), the AC1054, AC1817 and AC1818 change-signal tests, and the REQ-209 font-metrics test. The rest of the REQ-209 suite runs alongside as dependency tests. The test filter uses only exact selectors: `test_UAT_AC1054_ or test_UAT_AC1817_ or test_UAT_AC1818_ or test_UAT_FC_REQ_209_`.
- **Builder instructions.** Make no edits and keep `a5a337c47c`. If the REQ-209 browser test skips, report the skip as missing evidence, not as a pass.
- **Resolution ladder.** Rung 1 decided it: REQ-209 asks for font metrics measured from the font that actually resolved, and the code does that. The earlier failure was in the test fixture, which checked cap height against the round "C" in "Contact"; round letters rise slightly above cap height. The tests stand.
- **Weak-evidence flags, carried forward:**
  - The REQ-209 browser tests skip themselves when Chromium can't launch, so a gate that counts skips as passes would accept geometry nobody measured.
  - `test_UAT_FC_BUG-58_invite_modal_fits` needs built `dist-assets`, so it fails in branch worktrees and passes in the primary checkout.

I checked the stored report: the ruling and the iteration number are on it. The report exists only in the local ticket store for now, because the sandbox blocked the sync to `github.com:22`.