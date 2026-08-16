---
uid: comment-4df59990
id: COMMENT-1079
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T06:29:00.326796+00:00'
updated_at: '2026-08-16T06:29:00.326796+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4c7acd7e
  kind: note
---

**REPORT-2080 (report-4c7acd7e) — FAIL: 1 violation, 1 warning, 0 needs_review.**

Ledger rebuilt from scratch: the story's `intent_uid`/`updated_by` record only BUNDLE-16 and REQ-136, so I reconstructed the eighteen-intent picture from the commit history of `packages/site-schema/src/l1/edit.ts` plus each intent's body. Every reconciled ask (REQ-117, 118, 119, 128, 132, 135, 136) is expressed in STORY-100, and every deferral it lists traces to a real intent. Coverage and exclusivity are clean.

The violation is a misstated rule, not a missing one:

- **STORY-100, "Refusing legibly"** claims "any value at all for a field the region offered read-only" is refused. The code refuses a locked field **on change, never on presence** (`packages/site-schema/src/l1/edit.ts:1159`, rationale at `:1134-1142`), and that is what intent wants — REQ-139 restates it as load-bearing. As the body reads, a modal that posts every staged field could never save a run whose family declares faces but no italic one, including an edit that only touched the words. The story already states the correct shape three times for bounds; the fix is to extend it to locks.

The warning is the same shape one axis over: "**Every** parameter this surface writes has a value at which it says nothing" — `fontSizePx` and `fontWeight` have none and are never removed (`edit.ts:876-907`), and no intent asks for one.

Two things I deliberately did **not** call violations: REQ-139 and REQ-140 both target this surface but carry `main_sha: null`, and the branch confirms their code is absent (descriptor type union at `:179`, `format` at `:202`) — so the story is accurate for `main` and repairing it now would make the matrix describe code that isn't there. They're logged as imminent with the exact edits they'll require. AC-1120 carries the same phrasing as finding 1 and will need an `ac-edit` at the next level down; its verification step is unaffected.
