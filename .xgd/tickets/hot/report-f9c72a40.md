---
uid: report-f9c72a40
id: REPORT-11978
type: report
title: 'Report: mode_override for story-6ccaedd5'
created_by: xgd
created_at: '2026-11-09T18:11:05.925997+00:00'
updated_at: '2026-11-09T18:11:05.925997+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-6ccaedd5
  anchor_ticket: bundle-0881342c
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-b47373ae
  quality_mode: reconcile
  justification: The reference state has a single [images] and a single [env.production.images]
    table; the working tree duplicates both, which makes wrangler.toml invalid TOML
    that wrangler would refuse at deploy. The AC-2537 test is correct and only the
    config can satisfy it.
  files:
  - apps/control-app/wrangler.toml
  rung: 2
  tip_evidence:
  - file: apps/control-app/wrangler.toml
    lines: 440-441
  - file: apps/control-app/wrangler.toml
    lines: 758-761
  external_cause: null
  planner_trust_boundary: false
  granted_head: c59872835e8f40a6d7e04078a0c5747a4ed0ed11
---

# Mode override granted: code_frozen

The reference state has a single [images] and a single [env.production.images] table; the working tree duplicates both, which makes wrangler.toml invalid TOML that wrangler would refuse at deploy. The AC-2537 test is correct and only the config can satisfy it.

Planner instructions for the batch:

wrangler.toml is invalid TOML because the REQ-222 cherry-pick appended a second [images] table (line 401) and a second [env.production.images] table (line 480) instead of merging them. Delete the second table of each pair. Fold the REQ-222 width-ladder rationale (optional binding whose absence means no srcset, metered per transform, content-addressed renditions cached under derived/<tenant>/ outside sites/) into the remaining top-level [images] comment, and add [[REQ-221]] and [[REQ-222]] to the citation on the remaining production block, as the reference does. Do not change any binding name or any other table. The AC-2537 test must then parse the file and find binding IMAGES on both sides.
