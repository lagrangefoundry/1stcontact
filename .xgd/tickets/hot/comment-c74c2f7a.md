---
uid: comment-c74c2f7a
id: COMMENT-1034
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T00:48:31.791669+00:00'
updated_at: '2026-08-16T00:48:31.791669+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-40dfb843
  kind: note
---

**Result: PASS** — REPORT-2033 (`report-40dfb843`), 0 violations, 2 warnings, 0 needs_review.

## What I checked

CAP-94 holds one story, STORY-107 (`story-b3de4571`, feature, 15 ACs), originating from BUNDLE-17 (`bundle-e59210c5`, `free_and_reconciled`) — specifically its **REQ-130** source ticket. No `updated_by` chain exists on the capability, the story, or any of its ACs, so no later intent has formally touched this tree. I walked the ledger forward through REQ-148 to find intents that bear on it anyway.

Every one of REQ-130's four evidenced acceptance items maps to a paragraph in the story body and at least one AC: structured `set_config` with deep merge, component instantiation from the closed catalog, `seo` merged into the rendered document, and `write_image` under its own `DrawImages` grant with the closed-by-construction SVG validator. The "Not in scope" list is reproduced faithfully. Exclusivity is clean — STORY-105 and STORY-106 (same bundle, different capabilities) own the declaration contract and the element tree respectively.

I verified two factual claims in the story body against code rather than taking them: the CLI really does name these operations `1c module add|set|rm` and `1c behavior list` (`tools/generate/src/cli/index.ts:1158-1187`, `:340`), and the "item 6 / item 7" cross-references resolve correctly (it's the operator's plan numbering, used identically by STORY-106 — not bundle ordering).

## The two warnings

**REQ-137 deletes `steps` from the palette entry schema.** It's `bundled` into BUNDLE-18, status `reconciling` — imminent but not enforced. STORY-107 and the CAP-94 body both name "palette families and steps" as an example settings shape. The branch under test still carries `steps` (`packages/site-schema/src/l1/palette.ts:72`), so the story is accurate against today's code. This should be repaired *by* that reconciliation, not before it.

**One behaviour is evidenced but unexpressed.** REQ-130 explicitly proves that copy inside an assistant-instantiated component is editable in the operator's click-to-edit modal — there's a passing UAT at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642`. The story body names only the element-tree write path as the refinement channel, and no AC covers it. I held this at warning rather than violation because it's a regression proof over the modal capability (REQ-117/118), which another capability owns, and the story does already name the modal as a co-user of the single write path. Ownership is a judgment call I flagged for the editor rather than resolved.

Three info entries record why REQ-134 (abandoned raster image generation) and REQ-131 (free-coded draft journal) are correctly absent from the matrix today.
