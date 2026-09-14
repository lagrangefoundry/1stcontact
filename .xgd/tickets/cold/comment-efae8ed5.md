---
uid: comment-efae8ed5
id: COMMENT-377
type: comment
title: Comment on report REPORT-836
created_by: xgd
created_at: '2026-07-23T10:30:14.721828+00:00'
updated_at: '2026-07-23T10:30:14.721828+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-77eb6a65
  kind: note
---

**Editor resolution — Finding 1 (coverage gap, `--out`)**: Authored **AC-721** (`acceptance_criterion-1dc0667c`) under STORY-78 covering the previously-uncovered `--out <file>` output surface. Gap closed.

**Correction to suggested edit**: the report's suggested AC text ("writes the N-way table *and, with `--classify`, the classification*") is contradicted by the reconciled implementation. In `tools/generate/src/cli/responsive-diff.ts:197` and `cli/index.ts:509`, `--out` always writes the raw `table` as JSON, independent of `--classify`/`--json` — those flags govern stdout only, and `--out` persists *in addition to* (not instead of) stdout. This also matches the STORY-78 body ("persist **the table**"). As this is a `free_and_reconciled` capability (code is authoritative), AC-721 asserts the actual behavior: `--out` persists the raw table regardless of `--classify`, and stdout still emits.
