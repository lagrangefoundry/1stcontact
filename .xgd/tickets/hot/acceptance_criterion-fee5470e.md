---
uid: acceptance_criterion-fee5470e
id: AC-868
type: acceptance_criterion
title: The check offers a machine-readable form carrying the whole report, whose success
  flag agrees with the exit status
created_by: xgd
created_at: '2026-08-06T03:31:11.869356+00:00'
updated_at: '2026-08-10T08:15:45.665538+00:00'
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
Asked for machine-readable output, the check emits a single structured document
instead of the human report, carrying a success flag plus the full report: the
recorded families, every font reference found with its site and file, every font
file found on disk with the locations holding it, every violation with its kind
and message, and every advisory entry. Nothing else is written to the output
stream. The success flag agrees with the process exit status — a passing run
carries a true flag and exits zero; a failing run carries a false flag and exits
non-zero.

## Verification
Invoke the check in machine-readable mode over a passing project and over a
failing one. Assert each emission parses as a single structured document, that its
success flag matches the run's verdict and the exit status, and that the report it
carries includes the recorded families, the references, the on-disk files, the
violations and the advisories.