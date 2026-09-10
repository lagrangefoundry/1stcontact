---
uid: comment-58b36d38
id: COMMENT-2522
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T11:33:10.453534+00:00'
updated_at: '2026-09-10T11:33:10.453534+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-42d17e29
  kind: note
---

**Result: FAIL** — 1 violation, 0 warnings, 0 needs_review. Report filed as `REPORT-3723` (`report-42d17e29`).

## Attempt 8 is confirmed repaired

The orphan-seam row is genuinely out of STORY-85's rejection table. I re-verified the five surviving rows directly against `packages/site-schema/src/schema.ts:566-618` rather than trusting the fix report, and `grep -rn "orphan"` over `packages/site-schema/src` and `packages/framework/src` still returns nothing.

## The new violation

Attempt 8's replacement sentence closes with an absolute the code doesn't hold:

> "The rule is one-directional: **every module must name a live, unique seam**; a seam need not attract a module."

`pageSchema.superRefine` takes the `if (!page.l1)` branch first, and there it raises an issue **only** when `m.slot !== undefined`. A module with no `slot` on a page with no `l1` validates — deliberately. The schema's own doc comment (`schema.ts:524-545`) frames the page as *two* shapes: "a **behavior-module stack** … or an **L1 page**."

Four independent witnesses:

- **A green UAT asserts the forbidden shape** — `tests/site-schema.test.ts:69-93` builds a page with non-empty `modules`, no `l1`, no `slot`; `test_UAT_FC_REQ-3_valid_minimal_site_validates` (`:155-158`) asserts `ok === true`.
- **The controlled comparison exists** — REQ-93's own negative test (`tests/req93-l1-slot-mounted-behaviors.test.ts:205-208`) uses non-empty `modules` with no `l1`, and it fails *only* because a `slot` is present.
- **The renderer has a live branch** — `render.ts:160`, with `:186` noting the edit stylesheet rides at page level "so it covers a module-only page too."
- **It's the conformance harness's default mode** — `oneModulePage` (`harness.ts:113-147`) emits no `l1` and no `slot` unless `mountInL1` is set, then validates through `loadSite`, which throws on invalid.

STORY-85 also contradicts itself twice: the table row directly above correctly scopes the rejection to "a module **on an L1 page**", and the `mountInL1` paragraph eight lines below names the very shape at issue — "not weaker inside a seam than **standing alone**."

I classified this a violation rather than a warning for the same cascade reason as last cycle: REPORT-3720 forwarded an `ac-add` for the page-level rejections, and an AC written from this clause would produce a UAT failing against correct code — specifically against the harness mode every module's universal ACs run through.

Two notes I put in the report for the editor: fix it from `schema.ts:570-582` and `harness.ts:113-147`, **not** from REQ-93's "Implementation (delivered)" narrative (the origin of both this and the previous defect); and don't over-correct — the modules-only page is legal but legacy, so this is a scope qualifier, not a new paragraph promoting the module stack.

The other six stories re-verified as aligned against their cited code (`render.ts:2150-2168`, `contact-form/meta.ts:30-78`, `palette.ts:96-107, 223-224`). No ticket movement since REPORT-3721, so the coverage baseline stands.
