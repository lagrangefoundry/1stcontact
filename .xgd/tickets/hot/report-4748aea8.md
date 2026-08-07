---
uid: report-4748aea8
id: REPORT-1586
type: report
title: 'Capability-Intent Alignment: site_colour_census_and_retrofit (level=ac)'
created_by: xgd
created_at: '2026-08-07T16:36:44.078566+00:00'
updated_at: '2026-08-07T16:36:44.078566+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-e382c142
  level: ac
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: site_colour_census_and_retrofit
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Structural note — the capability has been merged

`capability-e382c142` (CAP-83) carries `fields.merged_into =
capability-b4ac88fc` (CAP-89, *Site Materials & Starting Point*), set
2026-08-07T15:59Z. Its sole story, STORY-97 (`story-5e7eb0c5`), has already
been reparented: `fields.capability_uid = capability-b4ac88fc`
(`last_field_updated: capability_uid`, 2026-08-07T15:26Z).

The ticket index still resolves STORY-97 under CAP-83 — that stale entry is
how `xgd ticket list --filter fields.capability_uid=capability-e382c142`
surfaced it for this check. CAP-89's body carries the census/retrofit scope
verbatim as its fourth scope section, so the consolidation is faithful and no
intent was dropped in the move.

This report therefore assesses **STORY-97's nine ACs** — the content that was
under CAP-83 when anchor report-17a279f7 was created, and which now lives
under CAP-89. This is bookkeeping of an in-flight consolidation, not intent
drift, and is recorded as `info` rather than a violation.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 (`bundle-0385746c`) — BUG-31 + REQ-114 + REQ-116 | free_and_reconciled | 2026-08-06, merged at `cd8f98c8` | **REQ-114** is the load-bearing member: the L1 palette colour model *plus* the retrofit of existing sites. §3 (alpha collapse first, then ramp grouping, unclustered keeps its own entry), §5 (a repeatable colour-census command; the capture→L1 fold stays literal-only and assignment is a separate re-runnable pass), and intent ACs 3/5/6/7 are this capability's share. | YES |
| BUNDLE-6 (`bundle-ab9e0cb6`) — REQ-58 + REQ-59 + REQ-61 + REQ-62 | free_and_reconciled | 2026-07-17 | Originating intent of STORY-80 (the palette *model*, capability-ae9d65d6). Touches this capability only as the dependency STORY-97 declares. | YES (context only) |

CAP-83 itself carries **no `intent_uid`** and no `updated_by` chain; STORY-97
and all nine ACs trace to BUNDLE-14 alone. No retired or abandoned intent
bears on this capability — the ledger is single-entry, so there is no
supersession to walk.

Intent-vs-matrix reconciliations already recorded in the story body and
confirmed against the repo during this check:

- REQ-114 AC7 asks the census to "reproduce the DOC-23 §5.3 table" (17
  literals / 15 RGB for `xgd`). The site has since gained a document-level
  text colour, so the command reports 18 / 16. The story body records this
  explicitly; the durable property is the method and the collapse, not the
  frozen counts. Correctly *not* frozen into an AC.
- REQ-114 AC6 asks all four `storage/sites/*` retrofitted. Verified in the
  worktree: `xgd` → 6 palette entries, `gigabytealchemy` → 8, `1stcontact`
  and `harbor-cafe` → no palette (zero colour literals, vacuously
  retrofitted); `theme.palette` is absent from all four. Matches the story
  body's stated observation exactly.

## Alignment Ledger

All nine ACs are `status: active`, `kind: behavior`, `regression_only: false`,
under STORY-97 (`story_kind: feature` — ACs expected and present).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-939 `681fa4dd` — human-readable census, read-only | BUNDLE-14 / REQ-114 §5, AC7 | aligned — covers story bullet 1; adds the zero-colour-site case and a byte-identity assertion on the definition |
| AC-940 `63d8463e` — machine-readable census | BUNDLE-14 / REQ-114 §5 | aligned — covers the story's `--json` clause; cross-checks its numbers against AC-939 |
| AC-941 `48360aec` — retrofit writes palette, rewrites literals, reports counts and files | BUNDLE-14 / REQ-114 §3, AC6 | aligned — covers story bullet 2's write surface |
| AC-942 `62c0b208` — one RGB at N opacities becomes one entry | BUNDLE-14 / REQ-114 §3, AC5 | aligned — covers the exact-alpha-collapse pass (see warning 2) |
| AC-943 `3f7e1894` — ramp grouping, vivid vs near-neutral, unclustered keeps own entry, determinism | BUNDLE-14 / REQ-114 §3 | aligned — asserts the grouping *outcome* the §3 measurement calls for, correctly leaving the chroma-not-saturation implementation choice out of the AC as the story body directs |
| AC-944 `3127e56f` — completed retrofit moves no pixel | BUNDLE-14 / REQ-114 AC3 | aligned — covers story bullet 3's positive proof (see warning 1) |
| AC-945 `66e919f9` — unprovable retrofit writes nothing | BUNDLE-14 / REQ-114 AC3 | aligned — covers story bullet 3's refuse path across all three named causes, plus the no-partial-writes property |
| AC-946 `c9cc59fc` — descriptive names, `--names` renaming | BUNDLE-14 / REQ-114 §3 | aligned — covers story bullet 4 |
| AC-947 `e7d18852` — separate, re-runnable pass | BUNDLE-14 / REQ-114 §5 | aligned — covers story bullet 5 and asserts the fold stays literal-only, which REQ-114 §5 states directly |

**Coverage**: every in-scope bullet of the STORY-97 body maps to at least one
AC, and no AC asserts behaviour absent from the story body. The command
surface the ACs describe exists as described — `1c colors <slug> [--json]`
and `1c colors <slug> --assign [--names <derived>=<chosen>,…]`
(`tools/generate/src/cli/index.ts:295,298`; implementation
`tools/generate/src/cli/colors.ts`). No `ac-add`, `ac-edit`, `ac-deprecate`
or `code-issue` finding is warranted.

**Exclusivity within STORY-97**: clean. The nearest pairs were examined and
are distinct criteria — AC-939/AC-940 are two different output surfaces with
a deliberate cross-check between them; AC-941/AC-944 separate the write-and-
report surface from the correctness proof; AC-942/AC-943 are the two
mechanically distinct derivation passes; AC-944/AC-945 are the success and
refuse paths; AC-947's re-census clause asserts reference-resolution
transparency rather than restating AC-939's census content.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | AC-932 (`acceptance_criterion-9f1e7baf`, STORY-80) vs AC-941 + AC-944 | ac-edit (on capability-ae9d65d6, **not** on STORY-97) | AC-932 sits on STORY-80 — the palette *model* story in capability-ae9d65d6 — but its criterion is entirely a *retrofit* outcome: "the number of entries is materially smaller than the number of distinct colours the site used" restates AC-941's first bullet, and "every colour the site painted before the conversion is still painted after it, and no new colour appears" restates AC-944. Both stories were touched by BUNDLE-14, which is how the surface came to be stated twice. STORY-97's body explicitly assigns the model to STORY-80 and the trip to itself, so the split the matrix records runs against the split the story bodies declare. | Narrow AC-932 to the model-side property (a palette may be materially smaller than the literal set; a site with no colour axes carries no palette and stays valid), and let AC-941/AC-944 carry the conversion outcome. Do not edit STORY-97's ACs — they are on the correct side of the boundary. |
| 2 | warning | exclusivity | AC-930 (`acceptance_criterion-bec4d585`, STORY-80) vs AC-942 | ac-edit (on capability-ae9d65d6, **not** on STORY-97) | AC-930's *criterion* is a legitimate model property (opacity rides the reference, entries stay opaque), but its **Verification** section verifies the conversion — "Convert a site's colour literals that share one RGB at differing alphas and confirm they collapse to a single palette entry" — which is exactly AC-942's assertion and exactly the alpha-collapse pass STORY-97 owns. The overlap is narrower than finding 1 (criteria differ, verifications collide) and is a warning rather than a violation on that basis. | Re-point AC-930's verification at the model (a reference carrying an alpha resolves to the entry's colour at that opacity; entries reject an alpha; exactness across the full alpha byte range), leaving the family-collapse assertion to AC-942. |
| 3 | info | — | capability-e382c142 | — | CAP-83 is merged into CAP-89 and STORY-97 is already reparented; the index entry that routed this check to CAP-83 is stale. CAP-89's body carries the census/retrofit scope verbatim, so no intent was lost. | none — expected consolidation bookkeeping |
| 4 | info | coverage | REQ-114 AC6 (four sites retrofitted) | — | The as-built repo migration state is asserted in the matrix by AC-932's "the two stored sites carrying L1 pages landed at 6 entries from 16 distinct RGB and 8 entries from 30" — i.e. on the *other* story. Verified accurate against the worktree. STORY-97's ACs correctly describe durable command behaviour rather than one-time migration state. | none — but note the interaction with finding 1: if AC-932 is narrowed, the as-built counts should not simply be deleted with it |

## Notes for the Editor

**Nothing under STORY-97 requires an edit.** Both warnings resolve on the
other side of the boundary — STORY-80 (`story-c490f1cf`) in
capability-ae9d65d6. If that capability's own ac-level check raises the
mirror-image finding and proposes editing STORY-97's ACs instead, this report
is the reason not to: STORY-97's body names STORY-80 as its dependency and
scopes the model out, and CAP-83's body (now CAP-89 §4) scopes the model out
in the same terms. The retrofit outcome belongs here; the model property
belongs there.

**One cross-cutting pattern worth recording.** BUNDLE-14 bundled a model and
its retrofit into a single intent, and the story split that followed drew the
line cleanly in the story bodies but not in the AC bodies — two of STORY-80's
six ACs reach across it. This is the characteristic drift shape for a bundled
intent whose halves land in different capabilities, and it is worth checking
for whenever a bundle's members split across a capability boundary.

**Factual checks performed** (read-only, no tickets/tests/code modified):
`storage/sites/*/draft/site.json` palette entry counts (6 / 8 / none / none)
and absence of `theme.palette` in all four; CLI surface registration in
`tools/generate/src/cli/index.ts`; presence of
`tools/generate/src/cli/colors.ts` implementing census, derivation,
lossless-gated assign and `--names`. All matched the story body's stated
observations, which is why the two intent/observation notes in that body are
recorded as reconciled rather than as drift.
