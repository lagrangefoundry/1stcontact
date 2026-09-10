---
uid: comment-d0bd06ac
id: COMMENT-2525
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T11:57:34.643861+00:00'
updated_at: '2026-09-10T11:57:34.643861+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d3e53eaf
  kind: note
---

**REPORT-3726** (`report-d3e53eaf`) — **FAIL**: 5 violations, 1 warning, 0 needs_review.

Scope walked: 7 stories / 105 ACs. All seven stories are `feature`/`upgrade`, so all are matrix-bearing. This is the first `ac`-level cycle here — the 7 prior attempts in this scope path are all `level=story`, and that chain closed PASS at REPORT-3725, so story bodies were the working reference.

**Violations**

1. **AC-718 was deprecated instead of repointed** (STORY-82). Its body still describes contact-form's `intro`/`submit` as declared L1 slots in pre-REQ-87 "capability" vocabulary; REQ-96 replaced both with one required `form` slot at v4 (`contact-form/meta.ts:27,58-61`). Its own UAT *was* repointed — `tests/reconciliation-reproduction-treatments.test.ts:125-198` asserts `slots === ['form']` and the submit as an L1 `control` leaf. Since AC-718 is the story's only contact-form criterion, deprecating it leaves the contact-form half of STORY-82's own title with no AC.

2. **STORY-83: no AC for the mounted-fragment emission.** The body claims it explicitly ("the one place the emitter inserts markup verbatim, unescaped") and STORY-85 defers to it twice. Shipped at `render.ts:2150-2168`, tested at `req93-l1-slot-mounted-behaviors.test.ts:349`. AC-723 covers only the no-mount placeholder.

3. **STORY-85: no AC for the REQ-93 page-level binding rule** — bolded in its In-scope list, a five-row rejection table in the body. Every existing validation AC (697/698/808) is instance-scoped. Shipped at `site-schema/src/schema.ts:569-624`.

4. **STORY-85: no AC for `mountInL1`** — the other bolded In-scope entry. AC-704 covers the five dimensions but never the mounted mode. Shipped at `conformance/harness.ts:140`.

5. **AC-719 offers a retired mechanism** — "(or a named overlay role)". REQ-114 retired the closed colour-role vocabulary, and AC-935 in this same capability asserts its absence; `layerColorRoleSchema` survives only in removal comments (`schema.ts:297,338`). STORY-82's body carries the same phrase twice, so the body needs the same edit — the one place this cycle requires a story-body change.

**Warning:** AC-930 and AC-1144 (STORY-80) state and verify the shade↔alpha composition claim twice in the same shape.

The dominant pattern: findings 2–4 are all REQ-93 behaviours that are implemented and covered by passing tests named `test_UAT_FC_REQ-93_*` — bound to the intent, never to an AC. Three `ac-add`s close them; no code or test needs to change.
