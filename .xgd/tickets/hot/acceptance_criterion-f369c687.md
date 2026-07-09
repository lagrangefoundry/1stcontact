---
uid: acceptance_criterion-f369c687
id: AC-535
type: acceptance_criterion
title: Report is emitted as human text or JSON, optionally written to a file, and
  exit status reflects fidelity
created_by: xgd
created_at: '2026-07-09T22:59:39.809085+00:00'
updated_at: '2026-07-09T22:59:39.809085+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
By default the command prints a human-readable summary (matched/unmatched/delta counts plus one line per delta, most-severe first; a clean run states no value deltas). With `--json` it prints the full report as JSON. With `--out <file>` it also writes the full report JSON to that file. The process exits non-zero when one or more deltas remain and exits zero when there are no deltas.

## Verification
Run the command with deltas present and assert non-zero exit plus one line per delta in default output; run `--json` and assert parseable report JSON; run `--out <file>` and assert the file contains the report JSON; run against a matching draft and assert zero exit and a "no value deltas" message.
