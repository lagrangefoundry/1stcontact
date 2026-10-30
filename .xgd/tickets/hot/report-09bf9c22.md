---
uid: report-09bf9c22
id: REPORT-5795
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T12:49:26.270170+00:00'
updated_at: '2026-10-02T12:49:26.270170+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Pick `6b494d130221f485a0549457ab13bb53e90a4748` — *feat(store): address assets by content, not by their bytes [FREE-CODED]* (REQ-304, 2026-09-22 17:18:41 -0700, 27 paths) onto HEAD `efbd668d28`. First attempt (`prior_stage_failure` empty, retry count 1). 10 `UU` paths, 17 applied clean.

**The developer already resolved this exact conflict.** REQ-304 was written on `free-REQ-304`, forked before REQ-305 (`7889c0753e`, streamed ladder), and the two were merged by hand in `9df761ad65` (*Merge xgd-working (REQ-305 ladder streaming) into free-REQ-304*), whose `# Conflicts:` list is 9 of these 10 paths. Its first parent IS this pick; HEAD is byte-identical to its second parent on 7 of the 8 code paths (the 8th, `revision-model.ts`, differs only by a branch-local block outside the conflict). Resync never picks merge commits, so that resolution cannot arrive through the queue — it was taken from the merge directly rather than re-derived.

## Files resolved

- `tests/fixtures/published-site.ts` — UU, 2c. Developer's merge blob (`9df761ad65`): both `blobs?: SiteStore` (REQ-304) and `derived?` (REQ-305) arguments kept.
- `tests/test_UAT_FC_REQ-222_width_ladder.test.ts` — UU, 2c/2f. Developer's merge blob: incoming's `buildFrom` listing-plus-reader source with REQ-305's `landed`. No test function deleted.
- `tools/generate/src/publish/ladder.ts` — UU, 2c. Developer's merge blob: incoming's pooled-over-pictures render reading through `source.read`, with REQ-305's sink, `landed` set and weight ceiling (now summing `AssetRef.size`).
- `tools/generate/src/publish/publish.ts` — UU, 2c. Developer's merge blob: incoming's `{ assets, read }` source plus REQ-305's `open`.
- `tools/generate/src/store/d1r2-store.ts` — UU, 2c. Developer's merge blob: union of the import lists; incoming's removal of the per-revision asset copy.
- `tools/generate/src/store/fs-store.ts` — UU, 2c. Developer's merge blob: union of imports; incoming's `placeBlob` clone.
- `tools/generate/src/store/index.ts` — UU, 2c. Developer's merge blob: both `decodeAssetManifest` and `diffOutlines` exported.
- `tools/generate/src/store/revision-model.ts` — UU, 2c. Developer's merge blob **plus** HEAD's `DERIVED_ROOT` / `derivedPrefix` block restored verbatim (25 lines, outside the conflict, not touched by this pick; the merge's second parent simply did not carry it).
- `tests/support/d1-site-factory.ts` — UU, 2c step 1, keep BOTH (not in the developer's conflict list; this is the recurring branch-local docblock conflict). Theirs' "today `[[REQ-304]]`'s `site_assets.digest`" clause and its new `pragma_table_info` paragraph, with ours' `0004_retire_site_slug` historical clause — `0005_retire_site_slug.sql` does not exist on this branch.
- `package.json` — UU, 2g, monotone counter. Base .326 / theirs .327 / ours .333. Ours kept: .333 came from xgd-working bumps already integrated on this branch, not from main, and the developer's merge also resolved to .333. The enrichment's timestamp rule does not apply to a counter.

## Incoming changes preserved

- Staged result vs `9df761ad65` across every path of the pick differs in exactly three places, all branch-local and none incoming-authored: `d1-site-factory.ts` (migration naming), `revision-model.ts` (+25, the restored HEAD block), and `tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts` (a 3-line comment HEAD carries differently; auto-merged, untouched).
- The 16 cleanly applied paths that should match the merge do, byte for byte, including `memory-store.ts` and `site-store.ts`, which the merge changed relative to both parents.
- `d1-site-factory.ts` proven both ways: ours→resolved equals base→theirs (29 lines each, identical apart from one reflowed sentence); theirs→resolved is only ours' pre-existing naming delta. Theirs' `0020` list entry, moved `LAST IN THE LIST` marker and `pragma_table_info` query auto-merged.
- No conflict markers in the staged diff. No unmerged paths. `CHERRY_PICK_HEAD` intact, HEAD unmoved. Nothing dropped under BUG-1301.

One resolution reaches outside the markers: in `revision-model.ts` git auto-kept ours' `snapshotEntries` body (`stamp: byteKey(bytes)`) although this pick deletes `byteKey`. The developer's merge rewrites it to `stamp: digest`; that line is theirs, taken with the blob.

## Verification

- `tsc -p tools/generate/tsconfig.json --noEmit`: 3 errors already on the branch (`templateUid`, control-app) plus ONE new: `src/store/memory-store.ts(421): Cannot find name 'StoredAsset'`. That file auto-merged and is byte-identical to the developer's merge, so the merge had the same error.
- `vitest run` on the REQ-222 width-ladder, REQ-304 content-identity and REQ-305 streamed-ladder node suites: 83 passed, 12 failed (REQ-222 fully green; 8 in REQ-305, 4 in REQ-304). Workers suites and `reconciliation-clean-page-urls` not run — `listen EPERM` in this sandbox.
- **All 12 failures and the tsc error are the developer's own intermediate state, and the next incoming commit fixes them**: `9d725c6e76` *fix(store): stamp an outline with the identity a store recorded* ("REQ-304, completing the merge with REQ-303's change-count outlines and REQ-305's streamed ladder") changes exactly `memory-store.ts` (`StoredAsset` → `AssetRef`, `a.size`), the REQ-304 test (`built.derived.keys()` → `built.landed`; the replaced-in-place assertion moved to the freeze), the REQ-305 test (cases go through the listing-plus-reader source) and `d1r2-store.ts`. Not fixed here: that would be authoring in unconflicted files, and pre-empting a queued pick.

## Flag for post-merge review

- The branch is red between this pick and `9d725c6e76`. Expected; do not test-fix.
- Forecast for `9d725c6e76`: its parent is the merge, and this branch now matches the merge on all five paths it touches except `package.json`, so only the `version` line should conflict.
- `DERIVED_ROOT` / `derivedPrefix` has no user outside `revision-model.ts` on this branch; xgd-working's merge parent does not carry it. Left as HEAD had it.
- `d1-site-factory.ts`: the `THE LAST STATEMENT OF THE LAST FILE` paragraph on this branch still argues from `0016`, and a stale `LAST IN THE LIST` comment remains above an earlier entry. Both pre-existing, neither touched.
- Two `0004_*` migrations and `0014_dns_changes` vs xgd-working's `0005`/`0017` naming — pre-existing, unchanged.
