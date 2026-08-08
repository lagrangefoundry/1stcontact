---
uid: comment-f4f1f112
id: COMMENT-836
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-08T00:06:14.111328+00:00'
updated_at: '2026-08-08T00:06:14.111328+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3a0d1cad
  kind: note
---

Report **REPORT-1668** (`report-3a0d1cad`) created — schema verified: `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-ae9d65d6`, `level=story`, violations 5 / warnings 3 / needs_review 0.

## Result: FAIL

I built the intent ledger from the six bundles the stories point at (BUNDLE-6/7/11/13/14/16) plus the four intents named directly in story bodies (REQ-87, REQ-90, REQ-91, REQ-93), and separated sibling-capability intents by confirming their owning stories rather than assuming.

**Violations (5)**

1. **STORY-82 — pre-rename terminology.** Body calls contact-form a "capability module" with "capability config"/"capability validators" and points at "the Capability Modules story". REQ-87 (free_and_reconciled, 2026-07-21) renamed the type and forbids a back-compat alias.
2. **STORY-82 — retired slots.** Body says the submit button is authored into the `submit` slot and framing into `intro`. REQ-96 (free_and_reconciled, 2026-07-26) deleted both; `packages/framework/src/modules/contact-form/meta.ts:58` declares one required `form` slot with `submit` as a *control*.
3. **REQ-93 coverage hole — the only real gap.** A whole reconciled intent (a page binding behavior-module instances to L1 slots; renderer mounting the fragment) is live in `packages/site-schema/src/schema.ts:478-599` and `packages/framework/src/l1/render.ts:1714,1998,2234`, yet named in no story and no AC in CAP-70 *or* CAP-71. STORY-83/AC-723 pins only the inert placeholder; STORY-84 explicitly hands the binding to "the behavior-module contract", which never picked it up.
4. **CAP-70 body scope is stale.** Its four scope sections cover none of interaction/motion/pointer (STORY-90), the link role (STORY-91), or the layout-mode track (STORY-81) — written 2026-08-05, one day before STORY-90/91 existed.
5. **AC-718** asserts the deleted `submit`/`intro` slots. Its own test (`tests/reconciliation-reproduction-treatments.test.ts:126`) already asserts the REQ-96 shape — the AC text lags, the code does not.

**Warnings (3):** STORY-83's "Merged from STORY-81" note reads as though STORY-81 is dead (REQ-104 revived it with AC-833…838); STORY-82's two ACs duplicate AC-716/AC-698/AC-701; "named overlay role" in STORY-82 and AC-719 survives REQ-114's deletion of the colour-role vocabulary.

Findings 1, 2, 5 and 8 share one root cause — STORY-82 was last updated under the pivot bundle and never caught up with REQ-87 or REQ-96 — so they close in a single editing pass. No `needs_review`, and no code issues: every divergence is matrix text lagging behind code that already implements the intent.
