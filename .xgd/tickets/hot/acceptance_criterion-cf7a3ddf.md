---
uid: acceptance_criterion-cf7a3ddf
id: AC-2080
type: acceptance_criterion
title: A successful capture_site on the deployed host writes one reference material
  ticket whose attachments are the bundle's members, each addressable as a single
  member
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:51:18.680127+00:00'
updated_at: '2026-11-01T01:51:18.680127+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
On the deployed host (the control-app Worker, which has a ticket store), a successful `capture_site` writes exactly one ticket of type `reference` for the captured bundle. Its fields include `kind: capture`, `bundle` (the bundle name) and `source_url` (the captured address). The ticket has one live attachment record per member the bundle holds. Each record carries the member name in `meta.member` (e.g. `capture.json`, `screenshot.full.png`, `assets/hero.jpg`) and has the content type that matches the member's extension. Any single member can be read by its member name without reading the others. The ticket has no single-file `filename` field. The result's `reference.uid` is that ticket's uid.

## Verification
Two parts:
1. Through the production composition of the Worker's fidelity surface (the same router wiring a request uses), with a doubled browser and a real ticket store: call `capture_site` on a public test page. Assert `reference.adopted === true`, a `reference` ticket exists whose `bundle` equals the returned bundle name, and its live attachments' `meta.member` set equals the bundle's member list.
2. Read `screenshot.full.png` by member name and assert its bytes equal the bundle's screenshot.

Note: expected to FAIL against current code. The Worker router does not supply the adoption dependency (STORY-159 Known gap 8).
