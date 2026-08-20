---
uid: comment-577b24db
id: COMMENT-1335
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T16:23:59.854351+00:00'
updated_at: '2026-08-20T16:23:59.854351+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d6dfbb22
  kind: note
---

**Result: FAIL** — 1 violation, 0 warnings, 0 needs_review. Report: **REPORT-2470** (`report-d6dfbb22`).

## What I found

**REPORT-2468's violation is genuinely repaired.** I verified AC-1329 against the current ticket rather than against the fix report's account: title retitled, fourth bullet and Verification both scoped to *behavioural* assertions with an explicit exemption for everything AC-1328 owns, and bullets 1–3 + both prior scoping paragraphs intact. Cross-checked against `origin/main` — the two `*.workers.test.ts` files and `test_UAT_FC_REQ-141_project_routing.test.ts` contain no runtime-conditioned assertion outside that exemption. That thread is closed.

**The new violation is on AC-1327, and no prior pass raised it.** Its fourth bullet — "A change made to the draft outside the builder is picked up on the next request, without the server being restarted" — is a freshness claim, and STORY-118's own Technical Context says in terms: *"CAP-85's builder origin owns request confinement and freshness, not the store's shape."* CAP-85 already carries it as active **AC-1033** (`acceptance_criterion-ae33f0ab`), with the same experiment in its Verification. It was delivered by **REQ-119** (`free_and_reconciled`, 2026-07-31), which is not among BUNDLE-19's nine source tickets — and `origin/main:tools/generate/src/cli/preview.ts:6` names REQ-119 as the source of exactly that staleness removal. Neither REQ-141 nor REQ-142 asks for it.

The claim is *true*; the defect is that its proof belongs to a sibling capability that already carries it. Left as-is, the uat cycle authors a duplicate freshness UAT under this capability and the freshness model acquires two homes.

**Suggested fix** (`ac-edit`, bullets 1–3 preserved verbatim): re-scope bullet 4 onto the property the port actually contributed — the preview re-asks the store per request and its memoised render is invalidated by the store's stamp (`preview.ts:79-86`, `:100`) — or simply delete it, which leaves no coverage gap since AC-1327 b1–3 plus AC-1354 fully carry the story's In-scope preview bullet. Explicitly not to be resolved by editing CAP-85.

## Pattern worth flagging to the operator

This is the third instance of one shape: an AC broadened past a scoping its own story states (AC-1329 twice — store axis, then runtime axis; now AC-1327 across a capability boundary). Each time the AC is true and the collision is with a sibling that already owns the proof. The report tells the editor to read remaining ACs against STORY-118's *"Relationship to existing capabilities"* paragraph and its three *"deliberate non-behaviours"*, not only against the In-scope list — the In-scope list says what the capability covers, those two paragraphs say what it must not restate, and that is where all remaining drift has been.

Two notes on the run: this worktree's HEAD predates BUNDLE-19's merge, so the port modules are absent and every code citation was read from `origin/main` (recorded as info #6). The report's git push failed on sandbox network restrictions — the ticket committed locally and reads back with the correct schema.
