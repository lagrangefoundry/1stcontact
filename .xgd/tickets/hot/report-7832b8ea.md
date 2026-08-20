---
uid: report-7832b8ea
id: REPORT-2288
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-08-20T00:57:52.768095+00:00'
updated_at: '2026-08-20T00:57:52.768095+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-2485c83c
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: The site palette: colour model (framework) vs mechanical retrofit (materials) vs settings write (authoring)
**Stories resolved**: 3 (3 confirm, 0 reassign, 0 merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-c490f1cf (STORY-80) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns what a palette *is* — the L1 value model. CAP-70's scope names "Absolute-or-overlay value system" verbatim; the story's own scope-boundary note disclaims census/retrofit to another capability. |
| story-5e7eb0c5 (STORY-97) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Owns the measurement + one-way migration of an existing site's colours. CAP-89 declares a "Site colour census & palette retrofit" scope section and explicitly puts the palette colour *model* out of scope, naming CAP-70 as its owner. |
| story-b3de4571 (STORY-107) | confirm | capability-2d32662d (CAP-94) | (no change) | Owns the group-agnostic settings write path, of which palette is one payload among theme and nav. Asserts merge semantics and whole-refusal, never colour semantics. |

### Why this overlap is acceptable

The three stories share the word "palette" but not a subject. The boundaries are
declared reciprocally by the capabilities themselves — each names the other two —
and are load-bearing in the code, not just in prose:

- **Model (CAP-70 / STORY-80)** — `packages/site-schema/src/l1/palette.ts`.
  `l1PaletteEntrySchema` (`{ value: opaqueHex }`, `.strict()`), `l1PaletteRefSchema`
  (`ref` + the `shade`/`alpha` axes), `l1ColorSchema`, and `resolveL1Color` /
  `resolveL1Palette` — what forms a colour may take, and how a reference becomes a
  hex at the load boundary.
- **Retrofit (CAP-89 / STORY-97)** — the `1c colors <slug>` census and `--assign`
  derivation. It *consumes* the model (fitting shades over the model's own shade
  function) and never defines it; its ACs are all about measurement, derivation
  order, the 8/255 bound, the lossless-or-refuse gate and fixpoint re-runnability.
- **Write path (CAP-94 / STORY-107)** — `editConfigSet` in
  `tools/generate/src/cli/edit.ts:1179`. It is group-agnostic: it deep-merges an
  arbitrary typed value at an arbitrary key and delegates *all* shape checking to
  `siteSchema` ("Nothing new is validated here and nothing needs to be… The gap was
  never the validator"). It is the mechanism that carries a palette to disk, not a
  statement about what a palette is.

Read as a sentence: STORY-80 defines the palette, STORY-97 derives one for a site
that predates it, STORY-107 is one of the ways a palette reaches disk. No AC is
asserted twice, and no story would lose its meaning if the other two moved.

There is a genuine functional touch-point — `editConfigSet` can write the same
`site.palette` field whose shape STORY-80 owns — but it is the same model-vs-write-path
seam the matrix already draws between the L1 element schema and element-tree
authoring, and it is clean in both directions: STORY-107's AC-1097 asserts only that
a value the schema rejects is refused whole, deferring the *what* to the schema.

### Observation for a later reconciliation (not actioned here — no content change made)

AC-1095 (`acceptance_criterion-3e72e4c7`, under STORY-107) carries prose superseded
by REQ-137. Its Verification reads "Write a complete colour palette (several
families, each with steps)", but a palette entry is now exactly one colour —
`l1PaletteEntrySchema` is `{ value: opaqueHex }.strict()`, and steps were removed
outright with no legacy reader — so a stepped entry is now *rejected* rather than
written. The same stale description survives in a comment at
`packages/site-schema/src/schema.ts:854` ("step-carrying").

This is documentation staleness, not a coverage gap: the AC's actual assertion
(deep merge at every depth, unnamed siblings survive) is correct and current, and
its evidence already uses the post-REQ-137 shape — the test at
`tests/reconciliation-beyond-l1-authoring.test.ts:160`
(`test_UAT_AC1095_a_settings_group_is_written_whole_and_unnamed_siblings_survive`)
writes single-colour entries such as `{ primary: { value: '#0f3f52' } }`. Left
untouched because this task's mandate is overlap resolution and no merge was
performed; flagged so a reconciliation of CAP-94 can refresh the wording.
