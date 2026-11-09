---
uid: report-d2c5193b
id: REPORT-11709
type: report
title: 'Fix reconciliation review: bug-00de1faf'
created_by: xgd
created_at: '2026-11-09T05:18:15.340767+00:00'
updated_at: '2026-11-09T05:18:15.340767+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bug-00de1faf
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
None. AC-2521 (story-e674c60a) Verification was rewritten to require each write to be started through its real entry point and to name the three new UATs. The Criterion text is unchanged.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes
`tests/test_reconciliation_builder_flip_in_place.test.ts` (tests only; no production code touched):

- **G1.** The old `test_UAT_AC2521_a_write_reloads_the_shown_page_in_place_and_stales_the_others` called `app.panel.reloadDocument()` directly. It is replaced by three UATs that drive the real writes:
  - `..._a_palette_change_...`: toolbar Colors button, then the real palette popup (select entry, edit hex, "Change color"), so `openPalette` `onChanged` fires. The palette transport is stubbed at the builder's own seam.
  - `..._a_segment_save_...`: Edit is shown. A real edit-bridge click on a segment opens the real segment modal; a colour is staged through the real pick-mode palette popup, then Save, so `mountEditor` `onSaved` fires. Only `/api/copy` is answered at `fetch`.
  - `..._an_assistant_change_...`: after a followed link, a real chat turn whose stream carries `site_changed`, so `onSiteChanged` fires. The chat transport is stubbed at its seam.
  - Each asserts that the shown document's `reloads()` is 1 and its `src` is not re-pointed, and that the idle frame was not reloaded, re-pointed or loaded. Then, after flipping, it asserts synchronously that `navsOf(idle frame)` equals `[previewUrl(site, idle channel[, rel])]` and that the pre-write document is not announced. A call site that reverted to `panel.frame.contentWindow.location.reload()` would leave the idle frame non-stale and fail that flip assertion.
- **Judgment-call observation.** The suite's MutationObserver now records in its callback (`record(records)`), so `navsOf()` read after an `await` is no longer vacuous. Two comments that described the old limitation were updated.

## Confidence
Moderate to high that the review's G1 is closed. The new UATs were written against the code they drive (palette-popup.js, editor.js, color-field.js, edit-client.ts, app.js wiring) but were not executed here, per the instructions. The full suite runs next. Making the observer record turns earlier post-`await` `navsOf` assertions into live checks; by reading the code, every one of them should hold.
