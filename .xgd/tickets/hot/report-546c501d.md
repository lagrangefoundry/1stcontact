---
uid: report-546c501d
id: REPORT-1562
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-07T05:17:31.564463+00:00'
updated_at: '2026-08-07T05:17:31.564463+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: request-66e4c630
---

All gates green. Here's what I fixed.

## Issues fixed

**Critical — 3 failing tests (the fail cause).** All three encoded pre-REQ-118 behaviour; the ACs had already moved during reconciliation. I re-pointed the evidence at the specimen each AC now names, without weakening assertions.

1. **`tests/reconciliation-copy-edit-write-path.test.ts:246`** (`test_UAT_AC981_…`) — dropped `A_IMAGE` from the `[A_CONTAINER, A_MODULE, A_IMAGE]` empty-list loop, since AC-981 now says an image "is not one of them". Replaced the drop with a stronger positive contrast at `:263` — the image region must return exactly `['src', 'alt']` of types `['enum', 'string']`, with the current handle present in the picker's options and both values read back. The AC's "an image region, which returns two" is now asserted, not just excluded.

2. **`tests/reconciliation-copy-edit-write-path.test.ts:603`** (`test_UAT_AC991_…`) — renamed to `test_UAT_AC991_markup_saved_as_text_stays_literal_and_every_field_is_plain_text_or_a_closed_list` (the old name's `every_field_is_plain_string` claim is now false). The sweep accepts `'string' | 'enum'` and, for `enum`, requires `field.enum` to be a non-empty array of strings — AC-991's new "every closed-list field carries the list of values it will accept". Added a `closedListsSeen > 0` guard so the branch can't pass vacuously. Also added AC-991's missing alt-text case at `:583`: the script/style payload saved into the image's `alt` comes back as the literal `alt` attribute, introducing no element and no active style — a separate escape path (attribute, not text run) that was previously untested.

3. **`tests/reconciliation-copy-edit-gesture-modal.test.ts:268`** (`test_UAT_AC1001_…`) — swapped the image specimen for the painted **container** at `0.0`, which AC-1001 now names. Kind assertion moved to `'container'` and the dialog text to `'Nothing to edit on this container segment yet.'`; the `fields === []` / `values === {}` and message-dialog assertions are unchanged. I also fixed **AC-1002** at `:317`, which clicked the same image to open the same dead-end dialog — it is `skipIf(!WEBUI_INSTALLED)` and skipped on this machine, so the reviewer's run couldn't see it, but it was a latent failure of the same regression. Both now share a `NOTHING_TO_EDIT_PATH` / `NOTHING_TO_EDIT_SEGMENT` constant so they cannot drift apart again. Fixture comments corrected — the image is now the contrast, not the specimen.

**Warnings.**

4. **`tools/generate/src/cli/edit.ts:698`** — `assetHandle` no longer mangles a complete reference into `/assets/https://cdn.example/x.png`. A src matching `COMPLETE_REFERENCE` (scheme or protocol-relative) passes through untouched; site-local forms normalise as before. I took the behaviour fix rather than narrowing the doc comment, because AC-1020 requires a listed handle be writable into a page "with no translation step" and the mangled form is not. The comment states explicitly that the envelope validator's URL-scheme allowlist remains the security boundary — this normalisation does not stand in for it. Evidence added in `tests/reconciliation-site-asset-listing.test.ts:296` under AC-1020.

5. **`apps/control-app/src/builder/api.js:34`** — `fetchAssets` had no caller and no test. Given evidence in `tests/reconciliation-site-asset-listing.test.ts:390` (AC-1023): driven against the real `startBuilder` origin through the module itself, asserting it returns the same entries as the CLI and that it *raises* on a caller fault rather than resolving to an empty list.

## Verification

- `pnpm test`: **175 files passed, 7 skipped; 1238 tests passed, 0 failed, 59 skipped** — up from 1235 passed / 3 failed, so exactly the three regressions closed and nothing else moved.
- `pnpm -r build`: exit 0.
- `tsc --noEmit` across all five packages: clean.

I left the changes uncommitted, matching the workflow's `xgd(<state>): done` commit pattern.

## Confidence

**High** for the fail cause — the three named UATs pass and the full suite is green, verified by running it directly rather than trusting a scoped report (the reviewer flagged that every quality report for this run recorded `"suites": {}`, which is how the regression reached review). Both warnings are addressed with executable evidence rather than comment edits.

One thing worth flagging for the reconciliation loop, outside this fix's scope: `tests/req118-image-selection.test.ts` still holds 11 `test_UAT_FC_REQ-118_*` tests despite `fc_orphan_check` passing, and they now duplicate coverage with the reconciled AC-1018–1023 / AC-981 / AC-991 UATs. The code review didn't raise it and matrix/UAT-naming mutations belong to the reconciliation review fix loop, so I did not touch it.
