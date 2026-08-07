---
uid: report-6d2f7dbd
id: REPORT-1618
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (story) — attempt 1'
created_by: xgd
created_at: '2026-08-07T19:54:55.085158+00:00'
updated_at: '2026-08-07T19:54:55.085158+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: story
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (story)

**Attempt**: 1
**Fixes applied this call**: 6 body edits across 2 tickets
**Violations remaining**: 0
**Needs more work**: false

All three actionable findings from report-c5a97ce2 (1 violation, 2 warnings) are
`story-body-edit`. All three are applied. The four `info` findings required no
action by their own statement.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-99 (story-e674c60a) | **Finding #1** — extended the "A single workspace, at one address" in-scope bullet: the origin now enumerates its operations as listing the store, publishing, *and* the read-and-apply steps of the write path, "as a thin transport that adds no semantics of its own"; a refused edit arrives as an *expected* refusal carrying the write path's own code/path/hint rather than a generic workspace failure. Closes with the ownership split verbatim: "What those operations mean, and what a refusal contains, belong to the write path's own story; this one owns only that they are reachable over this origin, in that form." |
| 2 | story-body-edit | STORY-99 | **Finding #1 (consistency half)** — amended the Out-of-scope editing bullet so it no longer reads as excluding the transport: "This story adds only that the write path is *reachable* over this origin and in what shape its answers arrive — never what it validates, writes or refuses." |
| 3 | story-body-edit | STORY-99 | **Finding #1 (cross-reference half)** — new Technical Context bullet "The edit transport is one seam, claimed once", naming CAP-86 / STORY-100 as the definer of the operations and this story as holder of the reachability/answer-shape half. Resolves the mutual-deferral state the assessor flagged (each story naming the other as owner). |
| 4 | story-body-edit | STORY-99 | **Finding #2** — repointed both stale CAP-84 references. "channels produced by CAP-82 … and CAP-84 (Edit Render Channel)" → "CAP-87 (In-Page Copy Editing)"; "the editable render belongs to CAP-84" → "belongs to CAP-87 (STORY-98)". Verified: CAP-84 (capability-25f7e486) is `status: superseded`, `superseded_by_uid: capability-12fee326` (CAP-87), and STORY-98 now carries CAP-87. STORY-99 body now contains zero occurrences of `CAP-84`. |
| 5 | story-body-edit | STORY-99 | **Finding #3** — new in-scope bullet "An origin that is missing is not a blank page": unconfigured vs. unreachable are two distinct, self-explanatory failures, the first naming how to start the origin, the second naming the address tried. Wording tracks AC-965 (`acceptance_criterion-5286c04b`, active) without duplicating its verification clause. |
| 6 | story-body-edit | CAP-85 (capability-a994b8f3) | **Finding #1 (capability half, explicitly requested)** — widened the "The workspace origin" scope bullet from "(listing the store, publishing)" to include the write-path transport and the refusal shape, plus the unconfigured/unreachable distinction. Added an Out-of-scope bullet "Edit semantics" so the capability states the ownership split from its own side. |

## Evidence Checked Before Editing

| Claim | Verified at |
|---|---|
| `/api/copy` GET/POST is a thin transport over `editCopyGet`/`editCopySet` | `tools/generate/src/cli/builder.ts:225` (route), `:242`, `:271` |
| `CommandError` is the *expected* answer to a bad edit → 400 with `code`/`path`/`hint` | `tools/generate/src/cli/builder.ts:353-362` (`err.toEnvelope()`) |
| Unconfigured origin → 503 naming `1c builder` | `apps/control-app/src/index.ts:27-33` |
| Unreachable origin → 502 naming the attempted address | `apps/control-app/src/index.ts:43-48` |
| STORY-100 asserts the counterpart sentence | STORY-100 (`story-37a3921b`, `capability_uid: capability-f753cecd` = CAP-86), body line 139 |
| CAP-84 superseded by CAP-87 | `capability-25f7e486.status = superseded`, `superseded_by_uid = capability-12fee326` |

## Code Edits (if any)

None this call. All three findings were categorized `story-body-edit` and the
production code already implements the behaviour in every case — the defect was
under-expression in the matrix, not drift in the code.

## Deliberately Not Done

| Item | Why |
|---|---|
| AC for the edit transport | Finding #1 states explicitly: "An AC will follow at the `ac` level cycle; this finding is the story-body half only." Level here is `story`. |
| STORY-100's stale `CAP-84 / STORY-98` pointer (`story-37a3921b`, body line 137) | Finding #2 marks it "out of this capability's scope but will need the same repair", and the editor brief forbids straying outside the failing capability. **Forwarded**: it is a one-line repoint to CAP-87, and it should be swept when CAP-86 is validated. |
| STORY-99's `no-store` divergence note (local preview server / STORY-95, STORY-96) | Info finding #6 and the assessor's method note both say the divergence flag is correct and should be preserved as-is. Left verbatim. |
| Anything about REQ-119 / the "deliberate and temporary" origin framing | Info finding #7: REQ-119 is `draft`, so nothing is retired. The framing is still correct. Left verbatim. |

## needs_review Items Forwarded

None. The report contained no `needs_review` findings, and no finding required
a judgement the intent ledger did not already settle.
