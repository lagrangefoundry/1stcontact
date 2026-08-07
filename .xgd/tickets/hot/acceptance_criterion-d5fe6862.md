---
uid: acceptance_criterion-d5fe6862
id: AC-867
type: acceptance_criterion
title: A run reports what it examined — families recorded, references found across
  sites, and font files on disk — so a pass cannot come from an empty scan
created_by: xgd
created_at: '2026-08-06T03:31:07.330845+00:00'
updated_at: '2026-08-07T18:45:04.807100+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Every run states its own scope, so a green result is legible as evidence rather
than as silence. The report carries the number of families recorded, the number of
font references found and across how many sites, and the number of font files
found on disk; when the run fails it lists each violation with its kind, its
message and its remediation; and when it passes it says so.

Run against the project as it stands, the check passes and those counts are all
non-zero — a pass that could equally have come from finding nothing is not a pass
this criterion admits.

## Verification
Run the check over the project as it stands and assert: no violations, overall
pass, and a non-empty set of recorded families, references and files on disk.
Render the report and assert the summary states all three counts. Run a failing
case and assert each violation appears with its kind, message and remediation.