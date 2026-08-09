---
uid: report-cbad1c8b
id: REPORT-1714
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-08-09T01:27:41.806488+00:00'
updated_at: '2026-08-09T01:27:41.806488+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: The palette colour model vs the mechanical migration onto it
**Stories resolved**: 2 (both confirmed in place); **1 acceptance criterion reassigned**

### Verdict

The boundary between these two capabilities is **real, clean, and already
documented on both sides** — no story is misassigned. The overlap the survey
detected is a genuine dependency, not an ambiguity:

- **STORY-80 / story-c490f1cf** (CAP-70, Framework Substrate) owns the palette
  colour **model**: the site-level palette shape, colour axes accepting a
  literal *or* a reference, translucency as an axis of the reference, dangling
  references failing validation, and resolution once at the load boundary.
- **STORY-97 / story-5e7eb0c5** (CAP-89, Site Materials) owns the **mechanical
  migration onto** that model: `1c colors <slug>` census, `--assign` retrofit,
  palette derivation (exact alpha collapse then hue-family ramp grouping),
  role-vocabulary renaming, and the lossless-or-refuse write.

Both capability tickets already state this split explicitly and in agreement:
CAP-89's scope claims "Site colour census & palette retrofit" and its Out of
scope disclaims "the palette colour *model* itself — owned by the framework
substrate capability"; STORY-80's Technical Notes disclaim "The colour census
and retrofit tooling that makes the model adoptable on existing sites is its own
capability", and STORY-97's Out of scope names STORY-80 as its dependency. The
stories are ordered by dependency (STORY-97 depends on STORY-80), which is the
correct relationship between a model and its migration — not a duplication.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-c490f1cf | confirm | capability-ae9d65d6 | (no change) | Owns the colour value *model* — schema shape, admissible forms, resolution semantics. Squarely the framework substrate's "absolute-or-overlay value system". |
| story-5e7eb0c5 | confirm | capability-b4ac88fc | (no change) | Owns the census + retrofit *tooling* over an existing site definition. Squarely CAP-89's declared "Site colour census & palette retrofit" scope. |

### AC-level correction (the one place the boundary actually leaked)

`AC-932` — *"A retrofitted site's palette is materially smaller than its distinct
colour count, with no colour lost"* — was filed under STORY-80 (the model) and
therefore sat in CAP-70, but it is entirely a statement about the **migration**:

- Its criterion opens "Converting an existing site's colour literals to palette
  references yields a palette rather than a colour list".
- Its verification is "For a retrofitted site, compare the declared palette size
  against the count of distinct colours in the pre-conversion definition".
- Its UAT (`test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours`)
  stages the real stored sites and drives `cmdColors` / `cmdColorsAssign` — the
  `1c colors --assign` retrofit command. It exercises no model-only behaviour.

Decisive point: AC-932 cannot be satisfied unless the retrofit tooling exists, so
leaving it in CAP-70 made the framework substrate's UAT coverage hostage to
CAP-89's tooling. Reassigned:

    xgd ticket update acceptance_criterion-9f1e7baf --fields '{"story_uid": "story-5e7eb0c5"}'

Reassigned rather than archived as a duplicate: STORY-97's existing ACs cover the
*mechanism* (AC-941 before/after counts, AC-943 clustering rules, AC-944
pixel-identity), but only AC-932 asserts the measured outcome on the two real
stored sites (`xgd` 6 entries from 16 distinct RGB; `gigabytealchemy` 8 from 30)
and that sites with no L1 colour axes carry no palette at all. That evidence is
distinct and worth keeping.

### AC-930 vs AC-942 — checked, deliberately left as a paired boundary

`AC-930` (STORY-80, "translucency is an axis of the reference") and `AC-942`
(STORY-97, "one colour at several opacities becomes one palette entry") look like
duplicates but are the two legitimate sides of this boundary:

- AC-930's load-bearing assertions are **model** invariants — the entry stays
  opaque, opacity rides on the reference, and `resolveL1Color` round-trips every
  alpha byte exactly across the whole 0..255 range. It uses the retrofit only to
  construct its fixture.
- AC-942 asserts the **producing** side — that the retrofit actually emits one
  entry with the alpha on each reference.

STORY-97's own Technical Context anticipates exactly this: "The round-trip proof
this story's write is gated on is the same guarantee the model asserts, checked
from the producing side." Left unchanged.

### Verification

- Every story in this cluster belongs to exactly one capability; neither was skipped.
- No story content was modified; no story was archived or created.
- AC relationships preserved: STORY-80 retains AC-716, AC-928, AC-929, AC-930,
  AC-931 (5); STORY-97 now holds AC-939..AC-947 plus AC-932 (10). No AC was
  orphaned. Confirmed via `xgd ticket get acceptance_criterion-9f1e7baf`, which
  resolves `fields.story_uid = story-5e7eb0c5`.
- **No test rename required.** AC numbers are global and stable, so
  `test_UAT_AC932_*` still satisfies the `test_UAT_AC<number>_*` convention with
  correct numbering; the AC->UAT link is by function name, not file path.

### Residue noted, deliberately not actioned

AC-932's UAT still physically lives in `tests/reconciliation-colour-palette-overlay.test.ts`,
whose header comment reads "Reconciliation UATs for story-c490f1cf". The test
would sit more naturally in `tests/reconciliation-colour-census-and-retrofit.test.ts`
(which already imports `cmdColors`, `cmdColorsAssign`, `collectColorLiterals`,
`freshCwd` and `REPO_ROOT`; it would additionally need `loadSite` from
`../tools/generate/src/store`). Not moved here: relocating test code is a source
change outside this overlap-resolution mandate, it carries breakage risk inside a
regression branch, and it yields no matrix benefit because the AC->UAT linkage is
by function name. Flagged for a later tidy-up pass.

**No code was changed in this cluster** — the only mutation is the single
`fields.story_uid` update on AC-932 (commit 79e6931c3).
