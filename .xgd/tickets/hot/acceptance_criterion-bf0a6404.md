---
uid: acceptance_criterion-bf0a6404
id: AC-858
type: acceptance_criterion
title: A site serving a font family that no record accounts for fails the check, which
  names the family and where to record it, and exits non-zero
created_by: xgd
created_at: '2026-08-06T03:29:32.163376+00:00'
updated_at: '2026-08-10T08:15:56.460434+00:00'
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
When any site in the project serves a font whose family appears in no provenance
record, the fonts check fails: it reports a violation of the unregistered-family
kind identifying the site, the family name, and the record the entry must be added
to together with the fields that entry needs; the run's overall result is a
failure; and invoking the check from the command line exits non-zero.

## Verification
Build a project whose record covers one family and whose site serves a different
one. Run the check and assert: overall result is failure, exactly one violation,
its kind is unregistered-family, its message names the unaccounted family and the
site, and its remediation names the provenance record. Run the same case through
the command-line entry point and assert a non-zero exit status.