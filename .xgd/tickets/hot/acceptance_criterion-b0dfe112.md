---
uid: acceptance_criterion-b0dfe112
id: AC-1508
type: acceptance_criterion
title: The components reference describes exactly the components the framework catalogue
  holds, with their settings
created_by: xgd
created_at: '2026-09-04T02:27:05.447300+00:00'
updated_at: '2026-09-04T02:41:24.994731+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

The components reference describes exactly the components the framework's catalogue holds — every one of them, and nothing that is not in it. For each component it states its name and version, the settings it takes (each with its type, its permitted values or numeric range where the catalogue declares one, its default where there is one, and whether it is required), the parts of a page it holds, and what it is obliged to satisfy.

Every fact is rendered from the catalogue's own declaration. A component the catalogue does not contain does not appear in the reference, and no setting appears that the catalogue does not declare.

## Verification

Read the generated components reference and assert that the set of components it names equals the set in the catalogue, in both directions — nothing described that the catalogue lacks, nothing in the catalogue left undescribed. For a component with settings, assert each declared setting appears with its type, its value set or range, its default, and whether it is required. Assert a plausible component name absent from the catalogue does not appear anywhere in the document.