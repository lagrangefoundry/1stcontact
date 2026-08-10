---
uid: comment-626bbd43
id: COMMENT-904
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-10T08:43:48.084293+00:00'
updated_at: '2026-08-10T08:43:48.084293+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4409a403
  kind: note
---

**Result: FAIL** — `report-4409a403` (REPORT-1764). 1 violation, 1 warning, 0 needs_review.

**Coverage is complete**: all 28 active ACs (13 on STORY-98, 15 on STORY-101) have `test_UAT_AC<n>_*` tests, every one driving real entry points — CLI command functions, the builder origin over HTTP, real DOMs parsed from the bytes `1c render --edit` wrote, Playwright where available. No AST-only stand-ins, no internal mocking.

**The violation is an evidence-validity failure, not a matrix gap.** I ran the suites rather than reading them alone:

| File | Result |
|---|---|
| `reconciliation-edit-render-channel.test.ts` | 13 passed |
| `reconciliation-copy-edit-gesture.test.ts` | 9 passed |
| `req118-image-selection.test.ts` | 11 passed |
| `reconciliation-copy-edit-gesture-modal.test.ts` | **5/5 failed** |

The modal file failed 5/5 on two isolated runs and 2/5 inside a 3-file run — non-deterministic, so AC-994, AC-1000, AC-1001, AC-1002 and AC-1003 currently have no valid evidence. Root cause is one helper: `settle()` (line 181) is a single `setTimeout(0)`, but the dialog only appears after `mountEditor`'s `await fetchCopy(target)` (`apps/control-app/src/builder/editor.js:90`) completes a real HTTP round-trip. Product code awaits correctly — this is a test-side race, and one lost race cascades through the other four (AC-1001 asserts against AC-994's late-arriving modal; AC-1003 sees two modals and a leaked request). Classified `uat-edit`, not `code-issue`.

Two things worth your attention beyond the report:

- **`git diff main..HEAD` on those paths is empty** — this is main's state, not something the regression branch introduced.
- **BUG-33 (`bug-ede1fb8c`) looks like it covers this but does not.** It names these exact five tests, but records them as "already green," changes other files instead, has `main_sha: null`, and its diagnosed root cause (`openLoneControl` at `editor.js:350`) doesn't exist in main's `editor.js` — which is 268 lines with no such function. Whoever reconciles it should re-run against main rather than `xgd-working`.

The warning: AC-997 claims "however many fields were edited" but its test only ever alters one field. The multi-field property *is* proven — `test_UAT_FC_REQ-118_alt_text_is_editable_alongside_the_image_and_saved_in_the_same_diff` asserts `changed: ['src','alt']` with one modified file — but under a name that traces to no AC.

No intent-level drift: every AC traces cleanly to BUNDLE-14, BUNDLE-16 and REQ-118, all `free_and_reconciled`. The gap is between ACs and their tests, not between the matrix and intent.
