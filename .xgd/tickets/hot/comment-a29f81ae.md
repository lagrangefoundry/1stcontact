---
uid: comment-a29f81ae
id: COMMENT-1204
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-20T01:04:58.101712+00:00'
updated_at: '2026-08-20T01:04:58.101712+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1c7a4efa
  kind: note
---

Cluster 3 resolved. Both stories **confirmed in place** — no ticket changes.

## Finding

The cluster flagged three touch points (catalog, config validation, vetted default look). In each, the two stories sit on opposite sides of a **producer/consumer** boundary, not on top of each other:

| Touch point | STORY-85 / CAP-70 (framework contract) | STORY-107 / CAP-94 (control surface) |
|---|---|---|
| Catalog | the `<id>@<version>` registry, `Behavior*` types, `kind:'behavior'` discriminant | `list_behaviors` **projects** it; unknown kind → the surface's `NOT_FOUND` envelope |
| Config validation | `validateBehaviorConfig` produces per-field violations | the surface **runs it ahead of** the site definition validator, so it's a field error not a render surprise |
| Default look | `contactFormPreset()` **produces** valid L1 with bound controls | adding with config alone **consumes** it, so the instance arrives rendering in one call |

I verified this against the committed evidence rather than the prose. The test files are disjoint by entry point:

- STORY-107 → `tests/reconciliation-beyond-l1-authoring.test.ts:279` — imports `tools/generate/src/cli` + the AI toolbox; AC-1098 asserts on the toolbox response and the CLI `{ok:false,error}` envelope.
- STORY-85 → `tests/reconciliation-behavior-l1-composition.test.ts:507` — calls `contactFormPreset` and `validateBehaviorInstance` directly against `l1NodeSchema`/`validateL1`.

Collapsing either direction would lose an independently-failing guarantee: the preset can produce valid L1 while the surface never wires it in (component arrives blank), or the validator can be correct while the surface calls it too late.

Reassignment was also wrong both ways — three of STORY-107's four subjects (settings, page metadata, generated images) have no module-contract content, and STORY-85 is the framework contract itself.

One thing worth recording: STORY-107's Technical Context had *flagged* this exact concern as an open follow-up ("a later reconciliation of that capability may want an L2-side criterion of its own"). AC-811 on STORY-85 is that criterion — so the flag is already closed, not outstanding.

## Report

`REPORT-2290` (`report-1c7a4efa`), verified: `report_kind=overlap_resolution`, `subject_uid=report-2485c83c`, `cluster_id="3"`, `result=pass`.

Note: the ticket commit landed locally but its `git push` failed (`Broken pipe` — remote unreachable). The report is readable locally, which is what the iterator queries, so this doesn't block the loop; flagging it in case the outer workflow expects the remote to be current.
