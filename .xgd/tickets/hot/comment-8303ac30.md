---
uid: comment-8303ac30
id: COMMENT-776
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T17:50:07.459258+00:00'
updated_at: '2026-08-07T17:50:07.459258+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c15dc084
  kind: note
---

Both categorized findings are fixed and verified. Report: **REPORT-1596** (`report-c15dc084`).

## What I changed

**Finding 1 (violation) — `tests/req118-image-selection.test.ts`**

The `REQ-118 image selection over the builder origin` describe was gated on `WEBUI_INSTALLED`, which withheld AC-1028's transport clause for a reason that didn't apply to it. I confirmed the gate was unnecessary before removing it: `startBuilder` (`builder.ts:386-404`) binds a port without touching a component, and `chromeHtml()` — the only webui consumer in `handleBuilderRequest` — is reached solely from `GET /`, which none of the four tests request. Dropped the gate, removed the dead import, and left a comment naming the real dependency boundary plus the rule for future tests (gate the `it`, never the `describe`).

Suite went **8 passed / 3 skipped → 11 passed / 0 skipped**.

**Finding 2 (warning) — `tests/reconciliation-edit-render-channel.test.ts`**

AC-954's obligation is on the catalog ("and for any module added after them"), but the test iterated a hand-maintained `SEAM_CASES` literal, so a third module would simply never be exercised. Added `seamCaseFor(def)` and rewrote the loop to iterate `registry`; a seam-exposing module with no entry now throws, as does an entry naming a seam its module doesn't declare. I also made the guard self-proving — it fabricates a would-be newcomer and a slot-renamed module and asserts both throw — matching the convention the report singled out this capability for.

## Verification

Capability's four owning files: **33 passed / 5 skipped → 37 passed / 1 skipped**. Full repo: **1184 passed, 113 skipped, 0 failed**. Typecheck produces a byte-identical error set for both files before and after (baseline via `git stash`) — the pre-existing errors are repo-wide `jsdom`/module-resolution noise. No production code touched.

The one remaining skip is AC-1002, which finding 3 correctly classifies as environmental with resolution "none".

## One thing I did not act on, and why

**AC-1028 doesn't exist as a ticket.** The report's ledger lists it under STORY-101 and counts 28 ACs; the matrix has 27 across the two stories (STORY-98: AC-948–958, AC-1007–1008; STORY-101: AC-993–1006), and the highest AC-10xx anywhere in the 312 acceptance criteria is AC-1027. REQ-118's criteria actually live as AC-1024–1027 under STORY-100 and AC-1020–1023 under STORY-102 — both in capabilities this one lists as *out of scope*. So the two `test_UAT_AC1028_*` tests are named for a criterion no ticket defines.

I forwarded this rather than guessing: renaming them would silently move evidence between capabilities, and creating AC-1028 would invent intent the ledger doesn't authorise. The operator decision is whether AC-1028 was meant for STORY-101 and never created, or the tests are misnamed and belong to Structured Copy Editing. Either way finding 1's fix stands — the clause now runs regardless of which ticket ends up owning it.

Changes are in the worktree, uncommitted, for the workflow to handle.
