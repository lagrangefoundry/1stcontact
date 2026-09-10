---
uid: report-f037e464
id: REPORT-3707
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (story) — attempt 7'
created_by: xgd
created_at: '2026-09-10T09:32:28.824486+00:00'
updated_at: '2026-09-10T09:32:28.824486+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: story
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (story)

**Attempt**: 7
**Fixes applied this call**: 3 ticket mutations, closing 5 findings (3 violations, 2 warnings)
**Violations remaining**: 0
**Needs more work**: false

Every violation and both warnings in REPORT-12605dba are addressed. No code and
no test was changed: all three findings resolved to matrix prose, exactly as the
assessor categorised them.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit (capability body) | CAP-85 (`capability-a994b8f3`) | **Findings 2 + 3, one edit as the assessor directed.** Narrowed the "The workspace origin" scope bullet: the parenthetical claiming the editing client is "served from the same source the renderer is built from, so the two cannot drift" is replaced by an explicit deferral to CAP-87 (AC-1006), and "carrying the write path's read/apply operations as a thin transport that adds no semantics of its own, so that a refused edit arrives as an expected refusal in the write path's own terms" is replaced by "hosting the write path's read and apply operations" with the semantics deferred to CAP-86 (AC-992). The Out-of-scope "Edit semantics" bullet was scrubbed in parallel — "as a transport that changes none of it" removed, both deferrals now cite the owning capability and its AC. **No AC added to STORY-99**, per the assessor's exclusivity warning |
| 2 | story-body-edit | STORY-99 (`story-e674c60a`) Technical Context | **Finding 1.** Rewrote "The staleness rule went with the artifact, and the reuse key moved". The claim "the deployed origin has one store per account, so the two are equivalent there" is withdrawn. The handle key is now stated as an *isolation* choice, and a new paragraph says where reuse is real: across requests behind the local front door, and **not at all at the deployed origin**, which builds a fresh handle per request so the account check cannot predate the request. Points at the store-adapter assembled-definition memo (AC-1447/AC-1448) as what actually makes a deployed request cheap |
| 3 | story-body-edit | STORY-99 "Divergence noted, in commentary only" | **Finding 4.** Added a second divergence entry in the identical form the story already uses for `toolbar.js:100`, recording that `router.ts:76-77`'s comment ("The Worker has one store per tenant per isolate, so the two are equivalent there") contradicts `store.ts:79`'s documented decision, that the opener is what runs, that the cache is therefore never hit at the deployed origin, and that no behaviour differs |
| 4 | story-body-edit | STORY-99 "Reconciliation Decisions" provenance headers | **Finding 5.** Corrected the mislabelled header from "reconciling BUNDLE-21 …, item 2" to "item 1 (BUG-36)" — every decision beneath it is BUG-36's. Added a new dated block, "reconciling BUNDLE-21 …, item 2 (BUG-37)", with two entries: the dead render cache recorded as BUG-37's **deliberate** non-fix (re-keying would trade the tenant-deactivation guarantee for ~1–4 ms) with the equivalence claim explicitly withdrawn; and a note that the assembled-definition memo is asserted at the store port, not restated here, to avoid stating one guarantee twice |
| 5 | ac-edit | AC-1033 (`acceptance_criterion-ae33f0ab`) | **Finding 1, criterion half.** Amended the reuse paragraph the same way — "Where a rendering is reused between requests, the reuse is held against the store the request reads through … That key is chosen for isolation, not for cost" — and added a paragraph distinguishing the local front door (reuse happens) from the deployed origin (fresh store per request, nothing reused), deferring the deployed origin's cheapness to the store layer. The negative guarantee ("two workspaces never share a rendering") and the **entire Verification section are byte-identical**, exactly as the finding required |

Items 2–4 were applied as a single `ticket update` on STORY-99; item 1 is one
update on CAP-85; item 5 is one update on AC-1033.

## Verification

- Re-read all three bodies after writing. Confirmed on CAP-85 that both
  over-claiming phrases ("thin transport", "transport that changes none of it")
  are gone and both CAP-86 / CAP-87 deferrals are present; confirmed on STORY-99
  that both provenance headers, the BUG-37 block, the new divergence entry and
  the AC-1447/AC-1448 citation are present.
- Grepped STORY-99 for every other occurrence of "reuse / wasteful / equivalent"
  to be sure the withdrawn claim was not restated elsewhere in the body. It was
  confined to the one bullet, which is fixed.
- Confirmed against the code before writing, so the new prose is accurate and not
  merely internally consistent: `apps/control-app/src/store.ts:79-83` documents
  `storeFor` as *"Constructed per request rather than memoised per isolate"* with
  the tenant-check rationale, `storeFor` builds a fresh `d1r2SiteStore` on every
  call, and `apps/control-app/src/router.ts:70-82` carries the stale
  "equivalent there" comment on the `PREVIEWS` WeakMap. BUG-37 (`bug-6612c4b7`)
  read in full — the ~77 ms × 5 measurement, the `(tenantId, slug)` memo, and the
  explicit refusal to re-key are quoted accurately. AC-1447, AC-1448, AC-1006 and
  AC-992 all confirmed to exist under the capabilities cited.
- `test_UAT_AC1033_a_definition_changed_outside_the_workspace_shows_on_the_next_request`
  (`tests/reconciliation-builder-request-time-render.test.ts:271`) read and
  checked against the revised criterion: it drives the local front door and
  asserts the definition is followed forward and back, never amortisation at the
  deployed origin. Nothing in it contradicts the new prose, and since AC-1033's
  Verification text is unchanged the UAT still proves the criterion as written.
  `uat_coverage` left at `pass` — untouched, since no test changed.

## Code Edits (if any)

None this call. All three violations were categorised story-body-edit / ac-edit
and resolved as such. Note that finding 4's stale comment at
`apps/control-app/src/router.ts:76-77` is a *commentary* divergence: correcting
it would be a runtime-tree edit outside a reconciliation's remit, so it is
recorded in the story instead, in the form the story already established.

## needs_review Items Forwarded

None blocking. Two notes carried forward for the operator / other cycles:

| Element | Assessor said | Decision needed |
|---|---|---|
| AC-992 (CAP-86, `acceptance_criterion-9561711e`) | Out of this check's subject: AC-992 still verifies "both the editable and plain rendered outputs **on disk**" and says a save "re-renders both", but REQ-119 removed the on-disk draft-side artifact — CAP-85's own AC-1031 asserts the channels answer "with no rendered artifact on disk". AC-992 appears to describe the pre-REQ-119 arrangement | Belongs to CAP-86's own validation cycle, not this capability. Not touched here — editing another capability's AC from this scope would be out of remit. Flagging so CAP-86's cycle picks it up |
| CAP-85 and all 36 ACs | "Provenance is thin throughout this capability" — no `intent_uid` on the capability or any AC; `updated_by` on the story holds only the latest updater | Not acted on: the assessor raised it as a conditional note ("if the field chain can be backfilled"), not a finding, and every candidate value would be reconstructed from bundle membership rather than recorded fact. Backfilling on a guess would put fabricated provenance in the matrix. Operator call — if the mapping can be sourced authoritatively, the next check at any level gets materially cheaper |

## Remaining Findings

Findings 6, 7 and 8 are `info` with resolution "none" — two verified
non-duplicate exclusivity pairs (AC-962/AC-1330, AC-1402/AC-1394) and one
re-verified divergence note. Nothing to do.
