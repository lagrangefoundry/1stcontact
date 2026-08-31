---
uid: report-bc3f1b17
id: REPORT-3133
type: report
title: 'Sync-main review: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T23:58:48.498101+00:00'
updated_at: '2026-08-31T23:58:48.498101+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-22
---

```json
{
  "findings": []
}
```

## Verification performed

- **Conflict markers**: grep for `^<<<<<<< ` across `.py`, `.yaml`, `.yml`, `.ts`, `.tsx`, `.json`, `.toml`, `.md` (excluding node_modules) — zero hits.
- **Pre-rebase merge-base**: `198f8ca0b9`. Main tip: `5078d6810d`. Pre-rebase HEAD (ORIG_HEAD): `6abf6d61d6`.
- **Main-side delta since merge-base** (excluding `.xgd` ticket store): a SINGLE modified file —
  `tests/reconciliation-palette-management.test.ts` (+23 lines, AC-1458 self-rename no-op UAT).
  Main deleted no files and removed no symbols in this window, so there is no deletion-revert
  surface to check.
- **Main's intent preserved**: `git diff main HEAD -- tests/reconciliation-palette-management.test.ts`
  is empty — HEAD's copy is byte-identical to main's. The new
  `test_UAT_AC1458_renaming_an_entry_to_its_own_current_name_succeeds_as_a_no_op` test is present.
- **No branch work dropped**: `git diff ORIG_HEAD HEAD -- ':!.xgd' ':!*.jsonl'` shows exactly
  +23 lines in the palette test and nothing else. The replay neither lost branch work nor took
  one side over-aggressively (Conflict Files was empty and no conflict occurred).
- **Integration consistency**: main's new test's helpers (`draftBytes`, `cli`, `seedSite`,
  `readSite`, `entriesOf`, `countOf`) are all defined in the branch's copy of the file. The
  branch touched no palette/rename production code, so the newly-landed test composes against
  unchanged behaviour.

## Note on the briefing (stale/inverted, not a defect)

The briefing's "Changed Files" list marks 14 paths `(deleted)` — e.g. `apps/control-app/src/shot.ts`,
`tools/generate/src/cli/capture/cf-driver.ts`, `tests/support/fake-puppeteer.ts`. These are NOT
main-side deletions resurrected by the rebase. They are absent from main because the **branch adds
them**: each is absent at the merge-base, absent in `main`, and introduced by a branch commit
(e.g. `shot.ts` by `1213d247dd feat(capture): Browser Rendering driver behind the BrowserDriver seam`).
The briefing's diff direction is inverted relative to the review procedure's assumption. Verified
directly rather than trusting the markers; no resurrection occurred.
