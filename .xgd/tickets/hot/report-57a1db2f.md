---
uid: report-57a1db2f
id: REPORT-2029
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-08-16T00:31:38.788556+00:00'
updated_at: '2026-08-16T00:31:38.788556+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-7ef6a9ea
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: Generated images: authoring operation vs site asset inventory and provenance
**Capabilities**: CAP-94 (capability-2d32662d), CAP-89 (capability-b4ac88fc)
**Stories resolved**: 2 (both confirmed in place — no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-b3de4571 (STORY-107) | confirm | capability-2d32662d | (no change) | Write path. Owns composing, validating and writing a generated image; only its terminal assertion touches the inventory. |
| story-c46abfa6 (STORY-102) | confirm | capability-b4ac88fc | (no change) | Read path. Owns the inventory's own semantics — the two-source union, provenance, handle vocabulary, usage kind — and never writes an asset. |

### Why this overlap is acceptable

The two stories sit on opposite sides of a **write/read seam over one shared
listing**, and neither claims the other's behaviour.

**STORY-107 (CAP-94) is an authoring operation.** Generated images are one of
four things it covers (settings, components, page metadata, drawings), all
reached through the site control surface. Its image-side ACs are all about the
*act of writing*: the closed-by-construction SVG validator (AC-1106), whole
refusal of anything executable or embedding (AC-1105), filename generation and
conflict on replace (AC-1107), and drawing-as-its-own-grantable-capability
(AC-1108) — the last existing precisely because a generated image is the one
image in a site that no person vouched for.

**STORY-102 (CAP-89) is an inventory surface.** Its six ACs (AC-1018–AC-1023)
describe only how the listing itself behaves: the union of the declared registry
and the draft asset directory, per-entry provenance flags, the single site-local
handle vocabulary, the derived usage kind, and reachability from the command
line and the builder origin. None mentions generated images, and none writes an
asset.

### The single point of contact is an integration assertion, not a duplicate claim

AC-1104 ("A composed drawing is written as an ordinary site image…") states that
"the site's image listing — the same listing every image picker reads — reports
it as an image." Its UAT
(`tests/reconciliation-beyond-l1-authoring.test.ts:612`,
`test_UAT_AC1104_a_drawing_becomes_an_ordinary_site_image_and_ships_unaltered`)
calls `write_image`, then makes exactly one `list_assets` assertion — that the
new handle appears with `kind: 'image'`.

That is the correct shape for this seam. It proves the write lands in the *one*
shared inventory rather than a parallel one — which is the load-bearing claim of
both capabilities ("three consumers, one listing" in CAP-89; "an ordinary entry
in the site's image list" in CAP-94). It asserts nothing about how the listing
derives its answer. Moving it to STORY-102 would be wrong, because it does not
test the listing's behaviour; deleting it would strip STORY-107 of the evidence
that a drawing is an asset and not a special case.

Evidence is likewise unshared: STORY-102's UATs live in
`tests/reconciliation-site-asset-listing.test.ts` (AC1018–AC1023), STORY-107's
in `tests/reconciliation-beyond-l1-authoring.test.ts`. No test is claimed twice.

### Why not reassign or merge

- **Reassigning STORY-107 to CAP-89** would drag settings, components and page
  metadata — three quarters of the story, all pure authoring operations — into a
  materials-inventory capability.
- **Reassigning STORY-102 to CAP-94** would move a read surface into an
  authoring capability, and CAP-89 names "the site asset store" as one of its
  four declared scope sections.
- **Merging** is unavailable: the stories describe disjoint behaviours (write vs
  enumerate) with no duplicated AC.

### Noted for a future reconciliation (not actioned here)

CAP-89's per-entry provenance today distinguishes *declared* from
*file-present*. A machine-composed drawing is a third kind of origin, and CAP-94
governs it with a separate grant (AC-1108) rather than a listing-side marker. No
current AC in either story claims the inventory surfaces "generated" as
provenance, so nothing is stale — but if that distinction is ever wanted at the
listing, it belongs to CAP-89 as a new criterion, not as a move of existing
scope. Recorded as an observation only; no story was created, per the
constraints of this step.

### Verification

- Each story belongs to exactly one capability (`capability_uid` unchanged and
  singular for both).
- Neither story was skipped.
- No merges performed, so no AC reparenting and no test renaming was required;
  all 21 ACs (15 on STORY-107, 6 on STORY-102) keep their existing `story_uid`
  and their current `test_UAT_AC<number>_*` names.
