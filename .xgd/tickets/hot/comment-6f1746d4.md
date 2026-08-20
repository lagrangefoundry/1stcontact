---
uid: comment-6f1746d4
id: COMMENT-1273
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T07:40:17.949753+00:00'
updated_at: '2026-08-20T07:40:17.949753+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-98fc4532
  kind: note
---

**REPORT-2402** (`report-98fc4532`) — **FAIL**: 6 violations, 1 warning, 0 needs_review. Schema verified (`report_kind`, `subject_uid`, `level=story`, integer counts, top-level `result`).

## What drifted

**REQ-93 is unowned by any story in the entire matrix.** It's `free_and_reconciled` (reconciled 2026-08-05 via BUNDLE-10) and delivered L1 pages hosting behavior modules in their slots. A scan of all 31 stories found zero references to it. Three of its four layers are live in code and undocumented:

- Page composition rule + binding validation — `packages/site-schema/src/schema.ts:523-600` enforces five distinct rejection cases (unbound module, dangling seam, double-bound seam, orphan seam, `slot` without `l1`), plus ambiguous duplicate names via `l1/slots.ts`
- Renderer mounts the module fragment into the seam — `packages/framework/src/l1/render.ts:2106-2122`
- `mountInL1` conformance mode — `tools/generate/src/conformance/harness.ts:140`

Only the fold half survived into the matrix, on STORY-84 (CAP-71). The capability body's "Out of scope" line correctly delegates the fold; the other three were dropped rather than delegated.

**STORY-83 actively contradicts it.** Its scope says a slot renders "as an inert labelled placeholder … with no module code and no behaviour attached" — stated unconditionally, but `render.ts:2119` emits the mounted fragment when one is bound. The inert render is the unbound case only.

**STORY-82 is stale wholesale.** Its last substantive update was the REQ-85 reframe (2026-07-22); every intent that changed its subject landed after — REQ-87 (rename, 2026-07-24), REQ-93, REQ-96 (2026-08-06). Three citable instances: retired `Capability*` vocabulary (`grep` confirms zero such names remain in framework source), the deleted `intro`/`submit` slots (`contact-form/meta.ts:58-63` declares one required `form` slot), and a claim that `fieldLabels=placeholder` is gone when REQ-93 landed it as `config.fields[].labelMode` — documented in-code as a captured a11y fact, not a dial. Its own `uat_coverage` field independently reads `stale`.

One warning: STORY-83's merge note calls STORY-81 "now archived", but REQ-104 revived it with a different scope.

Two `ready_to_reconcile` intents are flagged as imminent rather than as violations — REQ-148 will change the behavior-module contract again (deleting Astro from the module render path, `AstroComponentFactory` → `BehaviorComponent`), so STORY-85 should expect a further upgrade.
