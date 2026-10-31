---
uid: report-5d9115e5
id: REPORT-6973
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T21:35:02.822769+00:00'
updated_at: '2026-10-31T21:35:02.822769+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

Incoming commit 9805ee506e ("Merge branch 'free-BUG-45' into xgd-working") is a duplicate of 90fa6ee73f, which is already on HEAD. Their +/- diffs are byte-identical, apart from one hunk in tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts. After that, HEAD integrated 55827606bc "fix(assets): a site's assets are the bytes it holds" (BUG-44). Its message says "Overrules BUG-45 per operator decision": it removed the site.json asset registry and re-aimed BUG-45's two UATs at BUG-44 as tests/test_UAT_FC_BUG-44_*.

- apps/control-app/src/material.ts: code (2c). Kept HEAD via BUG-1301 precedence / 3h tier 1. HEAD already holds BUG-45's editAssetAdd routing, as revised by BUG-44 (no alt, no registry). It also has BUG-47's recordPlacement, which the incoming side would drop.
- tools/generate/src/cli/edit.ts: code (2c). Kept HEAD for the same reason. The incoming side re-adds registry writes that BUG-44 removed.
- tools/generate/src/cli/ai/l1-surface.json: code (2c). Kept HEAD for the same reason, plus REQ-176 wording.
- package.json: config (2g). Kept HEAD's version 0.2.48. The incoming 0.2.41 is an older bump, from the original 0.2.40 -> 0.2.41 that is already in HEAD's history.
- tests/test_UAT_FC_REQ-130_beyond_l1.test.ts: UAT (2f). Kept HEAD. It already has the BUG-45 assertion ("cannot go and get a file"), updated by REQ-176 to check "Site asset" instead of "Put it on the site". The incoming text would assert a UI label that no longer exists.
- tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts: DU (2a). Ran git rm. This file has never existed in HEAD's history, so the incoming edit to it has no target on this branch.
- tests/test_UAT_FC_BUG-45_promoted_asset_is_registered.workers.test.ts and tests/test_UAT_FC_BUG-45_surface_tells_the_truth.test.ts: incoming additions, removed from the index. 55827606bc already renamed them on HEAD to test_UAT_FC_BUG-44_promoted_asset_is_usable.workers.test.ts and test_UAT_FC_BUG-44_surface_tells_the_truth.test.ts.

The staged result has no diff against HEAD. The commit's effect is already integrated (BUG-1109/BUG-1122 shape), so the finalize step should skip it.

## Incoming changes preserved

Every hunk of 9805ee506e is already in HEAD through 90fa6ee73f, so none of it is discarded. The parts that are no longer in HEAD's form (registry writes, altFromMaterial, the "(unregistered)" wording, the BUG-45 UAT filenames, the "Put it on the site" label) were deliberately removed or renamed by later integrated commits: 55827606bc (BUG-44, operator decision overruling BUG-45) and the REQ-176 rename. Those are legitimate, documented refactors, so the BUG-1301 precedence exception applies. The REQ-163 hunk targets a file this branch has never contained.

## Arbitration of last resort (BUG-1460)

Tier 1 (most recent intent ticket). BUG-44 commit 55827606bc explicitly overrules BUG-45, and it is later on the working timeline (its parent chain contains 90fa6ee73f). Dropped side: incoming, for material.ts, edit.ts, l1-surface.json, and the REQ-130 test. Evidence: the 55827606bc message ("Overrules BUG-45 per operator decision", "BUG-45's two UATs are re-aimed at BUG-44") and a byte-identical diff comparison of 9805ee506e against 90fa6ee73f.
