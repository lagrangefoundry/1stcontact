---
uid: acceptance_criterion-7eee3f0e
id: AC-2583
type: acceptance_criterion
title: place_on_site renames around a taken site asset name and never overwrites it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:48.464556+00:00'
updated_at: '2026-11-09T23:18:48.464556+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

When the target name is already taken by a different file on the site, `place_on_site` stores the item under a new, non-conflicting name rather than overwriting. The existing site asset's bytes are unchanged. The response's `asset` and `src` report the name the bytes actually landed under, which is not the taken name.

## Verification

Put a file named `logo.png` with known bytes on the site. Then place a Library item whose filename is also `logo.png` but whose bytes differ. Assert that the original `logo.png` bytes are unchanged, that the response's `asset` is a different name, that `src` equals `/assets/<that name>`, and that the site's asset listing contains both files.
