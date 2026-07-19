---
uid: acceptance_criterion-9c235ff1
id: AC-657
type: acceptance_criterion
title: values-diff --json prints exactly one parseable JSON document to stdout
created_by: xgd
created_at: '2026-07-19T03:01:41.787749+00:00'
updated_at: '2026-07-19T03:01:41.787749+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

## Criterion
When a `values-diff` command (single-width or `--multi-viewport`) is run with
`--json`, everything written to stdout is exactly one well-formed JSON document
that a downstream JSON parser accepts without error. No render or bootstrap
diagnostic text is interleaved with or appended to the document on stdout.

## Verification
Run a `values-diff --json` command and capture stdout only. Parse the captured
stdout as JSON and confirm it succeeds and yields the command's diff document
(not a parse error). Confirm no diagnostic strings (e.g. dependency
re-optimization notices, "Missing pages directory") appear in the stdout stream.
