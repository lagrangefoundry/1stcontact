---
uid: report-4c496dc4
id: REPORT-3575
type: report
title: 'Overlap resolution: cluster 6'
created_by: xgd
created_at: '2026-09-09T23:15:08.907686+00:00'
updated_at: '2026-09-09T23:15:08.907686+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-e37a6b4a
  cluster_id: '6'
---

## Cluster 6 Resolution

**Boundary**: Two colour censuses over the same site definition
**Stories resolved**: 2 (both confirmed — no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-ee073693 (STORY-113) | confirm | capability-a0bba4ec | (no change) | Its census is keyed on **palette entries** — per-entry reference counts that price an edit. That is CAP-98's first declared scope bullet. |
| story-5e7eb0c5 (STORY-97) | confirm | capability-b4ac88fc | (no change) | Its census is keyed on **colour literals** — distinct hex, distinct RGB, alpha families — as the input to palette derivation. That is CAP-89's "Site colour census & palette retrofit" scope section verbatim. |

### Why this overlap is acceptable

The cluster was flagged on a shared *word* ("census") and a shared *input* (the
site definition). It is not a shared behaviour. The two measurements have
different domains, different answers, different callers and different purposes:

| | STORY-113 (CAP-98) | STORY-97 (CAP-89) |
|---|---|---|
| Entry point | `1c palette get <slug>` + origin route + assistant tool | `1c colors <slug>` (`--json`, `--assign`) |
| Domain measured | the palette's key set (named entries) | raw colour literals in the definition |
| Answer | per-entry reference count, at any position in the family | distinct literals w/ use counts, distinct RGB ignoring alpha, alpha families |
| Purpose | gate the delete rule and the rename confirmation | derive a palette that does not yet exist |
| Precondition | a palette already exists | typically no palette exists |

They are the **post-** and **pre-** migration measurements of the same site.
STORY-97's census exists to find structure where there is no palette; STORY-113's
exists to state what changing an existing entry costs. On a fully retrofitted
site the two report near-complementary results — STORY-97's literal census
collapses toward zero exactly as STORY-113's entry counts become non-zero.
Neither can be computed from the other.

### The boundary is already declared reciprocally on both capabilities

No capability-body edits were needed; each side already disclaims the other's
half in prose:

- **CAP-98 → out of scope**: *"Deriving a palette from a folded site's colour
  literals, and the census of those literals — owned by the site materials
  capability (colour census and palette retrofit)."*
- **CAP-89 → in scope**: a dedicated *"Site colour census & palette retrofit"*
  section; and **out of scope**: *"Any colour-picker or palette-editor UI"*,
  which is CAP-98's territory.

The stories themselves repeat the same line. STORY-113's own "Out of scope"
reads: *"Deriving a palette from a folded site's colour literals
(`1c colors --assign`), which already exists and is not rebuilt here."*
STORY-97's reads: *"Any colour-picker or palette-editor UI. Explicitly deferred
by the intent."*

### AC-level check: no duplication

All 12 ACs on each story were listed and compared. The two census ACs are the
closest pair and are still distinct subjects:

- **AC-1229** (STORY-113) — *"Reading the palette answers with every entry and
  how many places reference it, counting the definition and every page at any
  position in the family"*
- **AC-939** (STORY-97) — *"Censusing a site reports its distinct colour
  literals with use counts, its distinct RGB ignoring alpha, and its alpha
  families, and changes nothing"*

No other AC pair overlaps. Nothing needed reparenting, so no test renaming was
required and every existing `test_UAT_AC<n>_*` name stays valid.

### Evidence in the code

The distinction is observable in the committed UATs, which exercise two
different real entry points against two different fixtures:

- `tests/reconciliation-palette-management.test.ts:207` —
  `test_UAT_AC1229_...` drives `cli(cwd, 'palette', 'get', slug)` and asserts
  per-entry counts.
- `tests/reconciliation-colour-census-and-retrofit.test.ts:231` —
  `test_UAT_AC939_...` drives `cli(['colors', 'ac939-colourful', '--sandbox'])`
  and asserts literal/RGB/alpha-family counts plus an unchanged tree hash.

Two entry points, two test files, two measurements — no shared implementation
that a merge would consolidate.

### Verification

- Every story in the cluster belongs to exactly one capability
  (story-ee073693 → capability-a0bba4ec; story-5e7eb0c5 → capability-b4ac88fc).
- Both stories were resolved; neither was skipped.
- No merges performed, so no AC relationships were disturbed; all 24 ACs remain
  parented to their original stories.
