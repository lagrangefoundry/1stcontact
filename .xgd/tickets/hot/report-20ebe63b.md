---
uid: report-20ebe63b
id: REPORT-4873
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:34:07.076401+00:00'
updated_at: '2026-09-23T22:34:07.076401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `tests/reconciliation-site-asset-listing.test.ts` — **UU**, code/UAT test file, rule **2c** (incoming is authoritative). Three conflict hunks, all resolved to the incoming side (`d46756fefa` — *fix(assets): a site's assets are the bytes it holds [FREE-CODED]*):
  1. **File header docstring** — ours described the listing as "the UNION of two sources"; incoming replaces it with the post-BUG-44 single-source claim plus an explicit note that AC-1019 is *withdrawn, not regressed*.
  2. **Comment inside `test_UAT_AC1018_…`** — ours said "a full asset store beside an empty declared registry"; incoming rewords to "a full asset directory and nothing declaring any of it".
  3. **`test_UAT_AC1019_a_declared_asset_contributes_its_identity_and_is_listed_with_no_file`** — incoming replaces it with `test_UAT_BUG-44_the_listing_reports_the_store_and_nothing_but_the_store`, which asserts the inverse property (a stale `site.json` `assets` array is ignored, never refused).

  Ours' entire contribution to this file, measured against the merge base (`git diff :1:<path> :2:<path>`), is three cosmetic terminology touch-ups from the HEAD-side commit *fix(uat): retire the superseded colour-retrofit UATs and stale wording*: "draft asset directory" → "site's asset store", "directory" → "store", in exactly the three paragraphs the incoming commit rewrites. The incoming prose already speaks in "store" terms throughout ("the bytes the site's store holds", "a file the store does not hold"), so ours' intent is a strict subset of incoming's and nothing is lost by taking theirs. Ours added, removed or defended no test in this file.

## Incoming changes preserved

- `tests/reconciliation-site-asset-listing.test.ts` — verified by `git diff d46756fefa -- <path>`, which is **empty**: the resolved file is byte-identical to the incoming commit's version. Every incoming change is present, including the removal of `REGISTRY`/`GHOST`, the registry-free `seedSite`, the `alt`/`registered`-free `StoreEntry` and `MIXED_STORE`, and the new `test_UAT_BUG-44_…` test.

### On the AC-1019 test function (STEP 2 §2f)

No test was deleted as a resolution shortcut. The removal of `test_UAT_AC1019_…` is the documented, deliberate act of the **incoming free-coded developer commit** `d46756fefa`, not of this resolution and not of HEAD: the incoming file header states in prose that AC-1019 "IS WITHDRAWN with the registry, not regressed", and the commit replaces it with a test asserting the inverse property over the same surface. §2f exists to stop the resolver from choosing to drop an inconvenient test; here the alternative — keeping ours' AC-1019 body — is not merely undesirable but incoherent: that body references `GHOST`, `REGISTRY`, `seedSite({registry})` and the `alt`/`registered` entry fields, all of which the merge had already removed cleanly in non-conflicting regions of the same file. Retaining it would mean partially reverting the incoming commit, i.e. discarding developer code, which §2c forbids.
