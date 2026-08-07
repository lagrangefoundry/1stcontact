---
uid: acceptance_criterion-63d8463e
id: AC-940
type: acceptance_criterion
title: The census is available as a single machine-readable document for scripting
created_by: xgd
created_at: '2026-08-06T21:07:19.270443+00:00'
updated_at: '2026-08-07T16:50:08.694470+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Requesting the census in machine-readable form emits exactly one JSON document
on standard output and nothing else. The document carries:

- the site slug;
- one record per distinct colour literal, each giving the literal as authored
  (normalised to lower case), its opaque RGB, its alpha as a 0–255 byte, and
  its use count;
- the count of distinct RGB values ignoring alpha;
- the alpha families, each giving an RGB value and the list of opacities it is
  used at.

The document parses with a standard JSON parser with no pre-processing, and
its numbers agree with the human-readable census of the same site.

## Verification

Run the census in machine-readable form, parse standard output as a single
JSON value, and assert the presence and types of each field. Cross-check the
distinct-colour and distinct-RGB counts against the human-readable form for the
same site.