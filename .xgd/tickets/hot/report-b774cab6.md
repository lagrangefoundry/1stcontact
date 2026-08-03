---
uid: report-b774cab6
id: REPORT-1138
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-03T03:58:05.120726+00:00'
updated_at: '2026-08-03T03:58:05.120726+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-8b2f295c
---

All 9 UATs pass. Full-suite run confirms no regression from the added file.

**Note on the one pre-existing failure**: `tests/bug17-fold-padding.test.ts > test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding` fails with `ENOENT` on `storage/references/gigabytealchemy.ai/index/multistate.json` — the retained third-party capture is gitignored and absent from this worktree. It is unrelated to this story's tests (my file guards nothing against it and does not touch that path); other tests that read the same bundle (e.g. `reconciliation-l1-seam-mounted-behaviors.test.ts` AC-785) skip when it is missing, whereas BUG-17's does not.

**One AC-to-code tension recorded in the test, not silently resolved** — AC-795's *Criterion* and its *Verification* are mutually inconsistent. The criterion's last clause requires the bundle's own `l1.json` to be untouched by an import (so the read-only gate re-folds the same input), which means re-importing the *same* bundle must re-bind its 3 absolute handles. The verification's "the second import reports zero newly-bound handles" can therefore only hold for the criterion's other clause — "importing an *already-localized* document rewrites nothing further". The test asserts both properties truthfully: same-bundle re-import yields byte-identical page definitions and an unchanged bundle artifact; a bundle whose fold is already localized (including non-root-relative spellings, to prove normalisation) reports `localizedAssets === 0`. The reasoning is documented in a comment at the assertion.

```
UATs generated for story story-8b2f295c (plan item 9 of 9)

Story: story-8b2f295c
Test file(s) created:
  - tests/reconciliation-repro-bundle-import.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-repro-bundle-import.test.ts"
```

Coverage, one test per AC, each driven at the operator boundary (`cmdRepro`, `cmdRender`, the `1c` CLI dispatcher) against bundles written to an isolated temp working dir:

| Test | AC |
|---|---|
| `test_UAT_AC792_every_media_handle_resolves_to_the_sites_own_mirror` | AC-792 |
| `test_UAT_AC793_rendered_output_is_self_contained_and_origin_free` | AC-793 |
| `test_UAT_AC794_unmirrored_handle_fails_the_import_and_writes_no_site` | AC-794 |
| `test_UAT_AC795_reimport_is_stable_and_the_bundle_artifacts_are_untouched` | AC-795 |
| `test_UAT_AC796_unreferenced_image_and_font_bytes_are_reported_not_subresources` | AC-796 |
| `test_UAT_AC797_seam_and_binding_disagreement_fails_naming_each_direction` | AC-797 |
| `test_UAT_AC798_fields_are_derived_from_captured_name_type_and_name_source` | AC-798 |
| `test_UAT_AC799_endpoint_is_captured_verbatim_absent_or_dropped_with_a_residual` | AC-799 |
| `test_UAT_AC800_summary_reports_nodes_handles_gaps_and_each_behaviour` | AC-800 |

No runtime code was modified, and no existing test file was touched.
