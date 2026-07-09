---
uid: acceptance_criterion-434a70e7
id: AC-536
type: acceptance_criterion
title: 1c diff shoots the draft and produces heatmaps + regions.json + summary
created_by: xgd
created_at: '2026-07-09T23:10:14.492260+00:00'
updated_at: '2026-07-09T23:10:14.492260+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
Running `1c diff <slug> --ref <bundleDir|refPng>` renders, serves, and screenshots the site's draft, diffs that screenshot against the reference, and writes to the output directory: a full-resolution diff heatmap image, a block-averaged diff heatmap image, and a `regions.json` report. When `--ref` names a capture bundle directory, its full-page screenshot is used as the reference; when it names a PNG, that PNG is used directly. Omitting `--ref` produces a usage error and a non-zero exit.

## Verification
Invoke the command against a slug with an injected browser driver and a reference (both a bundle dir and a bare PNG), then assert all three artifacts exist in the output directory and the report references the resolved reference and actual paths. Separately invoke without `--ref` and assert a usage error and non-zero exit.
