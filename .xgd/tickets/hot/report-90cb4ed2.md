---
uid: report-90cb4ed2
id: REPORT-11530
type: report
title: 'Fix reconciliation review: bundle-0d00566a'
created_by: xgd
created_at: '2026-11-08T17:33:46.690857+00:00'
updated_at: '2026-11-08T17:33:46.690857+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-0d00566a
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
None. AC-2464 wording is kept as written, because every claim G1 named is now evidenced.

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes
Test only: tests/reconciliation-builder-workspace-import-graph.test.ts. No production edits.

The file gains three UATs that drive the real `1c assets` (`run(['assets'])`) in a mirrored checkout. The mirror symlinks every repo entry. It owns the broken file plus every directory the build writes to: dist-assets, src/generated and module-assets.ts. That keeps the real repo out of reach. The mirror's dist-assets is seeded with a known "previous" tree.

- test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical. builder/main.js gains `import '/framework/never-built-ac2464.js'`. The test asserts:
  - CommandError(ENVIRONMENT) naming the edge;
  - dist-assets.staging holds the whole staged tree, broken import included;
  - dist-assets is byte-identical to its pre-build snapshot;
  - no .retired directory exists.
  If the swap ran before the check, this test would fail. (G1 claim 1, remediation (a).)
- test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_fails_1c_assets_naming_the_importer_and_the_specifier. shade.ts imports './nowhere-ac2464'. The test asserts the exact ENVIRONMENT message naming the importer and the specifier, and that the served tree is untouched. (Remediation (b).)
- test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier. shade.ts imports a real file that sits outside the checkout. The test asserts the exact "lies outside the repository" message and that the served tree is untouched. (Remediation (b).)

A fourth UAT, test_UAT_AC2464_type_only_imports_are_not_emitted_and_an_import_quoted_in_a_comment_is_left_as_written, runs after the happy-path build. It covers edit.ts's type-only ./palette and ./types imports, and the doc-comment line that quotes `from './palette'`. It asserts:
  - palette.js and types.js are not emitted;
  - no emitted specifier names them;
  - the comment line appears verbatim in site-schema-edit.js, unrewritten.
(Remediation (c).)

## Confidence
High that G1 is closed, provided the tests pass in the suite run. Nothing was run in-session, as instructed. A tsc --noEmit check on the file is clean. ESLint was not run because the sandbox blocked the npm fetch.
