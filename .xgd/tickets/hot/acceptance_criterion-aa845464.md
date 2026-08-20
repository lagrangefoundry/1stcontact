---
uid: acceptance_criterion-aa845464
id: AC-1338
type: acceptance_criterion
title: A check with nothing to test against is reported skipped with its missing input,
  never as a pass, and counted separately
created_by: xgd
created_at: '2026-08-20T05:31:31.941022+00:00'
updated_at: '2026-08-20T05:31:31.941022+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

A check with nothing to test against is reported as **skipped**, never as passed. Run without a site
slug, the site-specific and preview-specific checks are each reported skipped with the reason —
which input was missing — while the origin-level checks still run and report their outcome. Run with
a slug but no preview identifier, the preview checks alone are skipped. Skipped checks do not make
the run fail, and the summary counts them separately from passes, so a run that proved nothing is
visibly a run that proved nothing rather than a green result.

## Verification

Run the check against a correct origin with no slug: the report marks the site and preview checks
skipped, each with the missing input named, the origin-level checks pass, the exit status is zero,
and the summary reports the skip count separately from the pass count. Repeat with a slug but no
preview identifier and confirm only the preview checks are skipped.
