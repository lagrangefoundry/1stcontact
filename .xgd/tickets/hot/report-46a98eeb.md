---
uid: report-46a98eeb
id: REPORT-3676
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (story) — attempt
  1'
created_by: xgd
created_at: '2026-09-10T05:59:10.803527+00:00'
updated_at: '2026-09-10T05:59:10.803527+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: story
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (story)

**Attempt**: 1
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All four violations shared one root cause, exactly as the assessor's note said: both stories in
CAP-101 describe a port and a cloud store as they were *before* REQ-149 (`request-554ac441`,
free_and_reconciled, member of `bundle-b3b7c399`, landed 2026-08-20, commit `30abfebebd`) moved
`pendingChanges` off the port, added the five revision storage verbs to it, and turned the cloud
adapter into a revision store. They were repaired as one consistent edit per story: the port
carries the revision storage verbs; every adapter answers them; *sequencing* a publish over them
is CAP-82's STORY-94.

Each claim was re-verified against the tree before editing, not taken from the report:

- `tools/generate/src/store/site-store.ts:206-234` — `revisions` / `writeRevision` /
  `readRevision` / `draftBase` / `setDraftBase` declared on the port; no pending verb.
- `tools/generate/src/publish/publish.ts:101` — `pendingChanges(store, slug)` is a function
  above the port, sequencing `revisions` → `readRevision` → draft read.
- `fs-store.ts:145`, `memory-store.ts:188-231`, `d1r2-store.ts:782-795` — all three adapters
  implement the verbs; `d1r2-store.ts:50` says "IT IS A REVISION STORE NOW (REQ-149)";
  `draftBase`/`setDraftBase` read and write `sites.base_revision`.
- `apps/control-app/src/router.ts:399-404` — deployed `POST /api/publish` runs
  `publishSite(await openStore(), …)`; `apps/control-app/src/store.ts:85-95` opens the D1+R2
  store per request, so the builder origin is a live production caller of this store.
- `tools/generate/src/store/index.ts:83-87` — `d1r2SiteStore`, `fsSiteStore`, `memorySiteStore`
  all exported live: three stores, not two.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-118 (`story-3f4a5f2b`) | **Findings 1 + 2 + collateral.** "What storage is asked": dropped "report what the draft has pending against the revision it descends from" from the declared operation set, and added a paragraph stating the port also carries the five revision storage verbs REQ-149 added, that every adapter answers them, that no editing command asks them, that publish and checkout are their callers, and that the pending question is now computed *above* the port. "Out of scope": replaced "Publish, checkout, render and history, which stay on the filesystem directly" with the exclusion that is still true — sequencing a publish or a checkout, and rendering, which are CAP-82's STORY-94 and since REQ-149 run *through* this port. Scrubbed two further places the same staleness had reached: the Technical Context non-behaviour "The filesystem-free store is not a revision store … Publishing and checkout remain filesystem-only" is now recorded in the past tense as the state at the time, explicitly superseded by REQ-149; and the relationship paragraph's "CAP-82 … owns a different store entirely" now says CAP-82 owns the published side and sequences over *this* port's revision verbs. |
| 2 | field-repair | STORY-118 (`story-3f4a5f2b`) | Set `updated_by: bundle-b3b7c399`, the bundle carrying REQ-149 — the intent this body edit reflects. The story previously had no `updated_by`, so a field-chain reader could not have found REQ-149 from it. |
| 3 | story-body-edit | STORY-121 (`story-fde7370b`) | **Finding 3.** Replaced the out-of-scope bullet "Publishing, checkout and revision history, which remain filesystem-backed here … This store reports every file as pending against no base" — false of this store, and already false when the story was authored on 2026-08-31 — with the true boundary: the store is a revision store holding revisions and the draft's lineage, and what is out of scope is the publish *sequence* over those verbs, which is CAP-82's STORY-94. |
| 4 | story-body-edit | STORY-121 (`story-fde7370b`) | **Finding 4.** Rewrote "Any production caller": kept the CLI sentence (verified — `tools/generate/src/cli/*` still uses `fsSiteStore`), dropped "the builder is still a proxy", and stated that the deployed builder origin is a live caller which opens this store on every route (REQ-145 deleted the proxy), which is why BUG-36 and BUG-37 are reports against it and why AC-1447/AC-1448 are observable at all. The exclusion now names what actually remains CAP-85's: the origin's own request confinement, freshness and bootstrap. This also removes the contradiction with the story's own Description ("The preview surface reads the draft on *every* request"). |
| 5 | capability-body-edit | CAP-101 (`capability-c4c7a854`) | **Assessor's second note.** Body said "Two implementations are live and current at the same time" and listed two; since REQ-143 there are three, and this capability's own AC-1385 says "all three live stores". Now states three, lists the D1+R2 account-scoped store as the third, and adds that one body of storage assertions runs against all three — which is the property AC-1385 asserts. |

## Also Addressed — Finding 5 (info)

The assessor noted that STORY-121's `updated_by` recorded only `request-13a5e206` (REQ-162)
while three of its criteria (AC-1387, AC-1447, AC-1448) formalize BUG-36 and BUG-37 from
`bundle-78f4e2fe`, so a field-chain reader would not find the two bugs. The story was being
edited anyway, which is the condition the assessor named for repairing it: `updated_by` is now
`["bundle-78f4e2fe", "request-13a5e206"]`. Its own `intent_uid` (`bundle-b3b7c399`) was
deliberately not duplicated into the list.

## Deliberately Not Touched

- **AC-1385's enumeration of "every question the editing surface asks"**, which omits the five
  revision verbs. The assessor recorded this as not a finding and explicitly left the decision
  — whether the revision verbs belong inside that enumeration or in a criterion of their own —
  to the `ac`-level cycle, so that it is made deliberately rather than by omission. The story
  bodies now say the verbs are on the port and that no editing command asks them, which is the
  framing under which AC-1385's editing-surface scoping reads correctly either way.
- **STORY-118's two-store framing** ("Two live stores — filesystem-backed and filesystem-free")
  in its Story, Description and In scope. This is correct at story scope: STORY-118 places "the
  Cloudflare store itself" out of its own scope by design and names that separation as the reason
  its correctness claim is checkable. The three-store count is a *capability*-level fact and was
  corrected there.
- **CAP-82's STORY-94 (`story-5349d01f`)**, which the assessor confirms is the correct and
  already-`updated_by: bundle-b3b7c399` home for REQ-149's publish-side behaviour. Nothing was
  moved into or out of it.

## Code Edits (if any)

None this call. Every finding was categorized `story-body-edit` and every one was resolvable as
one. No production code was read as wrong: the tree is the source of truth here, and it was the
matrix that had drifted behind it.

## Tests Run

None applicable — no test, AC or production file was modified; the mutations are ticket bodies
and two `updated_by` fields.

## needs_review Items Forwarded

None. The assessor recorded no `needs_review` items, and no ambiguity arose during the fix that
the implementation did not settle.
