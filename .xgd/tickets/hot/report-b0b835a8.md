---
uid: report-b0b835a8
id: REPORT-1371
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T03:31:51.671339+00:00'
updated_at: '2026-08-06T03:31:51.671339+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-ee56a66e
  plan_item_index: '10'
---

Story and 12 ACs created, grounded in REQ-101's body, the operator's comment thread (which records the mid-implementation change of scope — provenance demanded of the file, not the reference), and the code as built.

**New capability (CAP-80, `capability-745b9a6c`)** — no existing capability covered licence provenance: CAP-70 owns *binding* a family handle to its served face (pixels), this owns *obligations* on the bytes.

**Coverage of the intent:** record contract (AC-857), the four violation kinds (AC-858 unregistered-family, AC-859 unregistered-file, AC-860 unprovenanced-file incl. derived/vendored-tree exclusion, AC-861 the three-state redistribution gate), the distribution marker as validated site contract (AC-862), advisory actions (AC-863), record-integrity-is-a-hard-error (AC-864), project-wide tree span (AC-865), reference→record join forms (AC-866), non-vacuity of a pass (AC-867), machine-readable form (AC-868).

**Divergences flagged in Technical Context rather than absorbed as correct:**
- The ticket's gap statement names a font-*acquisition* path; none was built (deliberate, per the operator direction and the ticket's "Not done" section). Story scoped to tracking + enforcement.
- A site whose definition fails to validate is silently skipped by the reference join — its references go ungated, though its files are still caught by the disk scan. Intent is silent; no AC asserts it, so regression can surface it.
- `commercial_use` and `self_host` are recorded but ungated; only redistribution gates.
- The pass line ("every referenced font is registered") under-describes a pass that also covers the disk scan; ACs written against what the check decides, not that wording.
- Backfill counts (23 files / 10 families / 7 with open actions) noted as repo state, not written into any AC — same for site-specific font content.

```
Story #10 created for reconciliation bundle-ee56a66e

Story UID: story-8685be2d
Title: Font provenance: every font file in the project is accounted for, and an unresolved licence cannot ship as product
Type: feature
Acceptance Criteria: 12 created

Progress: 10 of 12 plan items complete
```
