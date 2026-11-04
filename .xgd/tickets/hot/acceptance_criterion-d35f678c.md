---
uid: acceptance_criterion-d35f678c
id: AC-2313
type: acceptance_criterion
title: bin/seed writes to the local store unless --remote is typed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:17.971283+00:00'
updated_at: '2026-11-04T18:17:17.971283+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
With no arguments, or with `--local`, `bin/seed` applies the fixture to the local D1 only. It targets the remote D1 only when `--remote` is given explicitly, and in that case it first prints a warning on stderr that invented people are being written to the database real customers use. Any other argument is refused with exit code 2 and an "unknown argument" message, and nothing is written.

## Verification
Invoke the runner with no arguments, with `--remote` and with an unknown flag, with the D1 executor stubbed. Assert that the local target is used by default, that the remote target and stderr warning appear only with `--remote`, and that an unknown flag exits 2 without invoking the executor.
