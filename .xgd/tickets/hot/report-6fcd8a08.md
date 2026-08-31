---
uid: report-6fcd8a08
id: REPORT-3011
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T17:18:38.893100+00:00'
updated_at: '2026-08-31T17:18:38.893100+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-78f4e2fe
  plan_item_index: '4'
---

Applied. Verification of the config against the ticket's claims before editing: `apps/control-app/wrangler.toml` carries `[observability] enabled = true / head_sampling_rate = 1` at the top level and `[env.production.observability]` placed *after* `name`/`routes`; `tests/support/wrangler-toml.ts` shows the repetition check enumerates only `vars` and structurally-found `binding` tables, so `[observability]` is genuinely invisible to it. That distinction shaped AC-1341's restatement — it now states the *rule* over every top-level declaration including inheritable ones, and states just as plainly that what the check *enumerates* is variables and bindings, with inheritable repeats pinned by their own criteria. Claiming the check enforced them would have been false.

```
Upgrade mutations applied for plan item 4 of 5

Target Stories: story-d5167ced
Primary Story UID: story-d5167ced
Stories Modified: 1
ACs Modified: 1
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d5167ced"          # STORY-119
  acceptance_criteria:
    modified: ["acceptance_criterion-7820683f"]   # AC-1341
    added:
      - "acceptance_criterion-1c5b368d"           # AC-1454 — unsampled retention, both environments, production route survives
      - "acceptance_criterion-9287f523"           # AC-1455 — retention is not a binding
    removed: []

Progress: 4 of 5 plan items complete
```

Notes on judgement calls, recorded in the story's Technical Context under `## Reconciliation Decisions` (entries 5–7, dated 2026-08-31):

- **Retention belongs here, not to BUG-37's own subject.** The bug is preview performance in the site store; the block it added is operator-surface deploy configuration, which is this story's. Nothing here asserts the CPU cost, and nothing asserts the free-plan ceiling — that was resolved by a billing change the matrix cannot hold.
- **"Not a binding" is a decision, not an inherited spec.** BUG-37 argues for the declaration and its placement and is silent on how the structural binding scan should see it. Formalised now, because the scan's generality is only safe while non-binding blocks stay invisible to it, and the REQ-145 criteria assert an exact production binding set.
- Story scope gained two out-of-scope lines rather than silently widening: reading/alerting on the retained logs, and the runtime cost that motivated them (CAP-101).

The four assertions in `tests/test_UAT_FC_BUG-37_observability.test.ts` now each have a formal AC to rename into — three under AC-1454, one under AC-1455.
