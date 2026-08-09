---
uid: report-15e47fdf
id: REPORT-1719
type: report
title: 'Overlap resolution: cluster 10'
created_by: xgd
created_at: '2026-08-09T01:45:50.957552+00:00'
updated_at: '2026-08-09T01:45:50.957552+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '10'
---

## Cluster 10 Resolution

**Boundary**: A pre-ship licence gate specified in provenance but enforced at the deploy command
**Stories resolved**: 2 (both confirmed, no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-8685be2d (STORY-92) | confirm | capability-b4ac88fc (CAP-89) | (no change) | The gate is a standalone build-time check command, not an enforcement point inside deploy. All 12 ACs are written against the check. |
| story-5349d01f (STORY-94) | confirm | capability-a12e557f (CAP-82) | (no change) | All 13 ACs are deploy mechanics (channels, content addressing, index CAS, prune, dry run). None mentions fonts, licences or distribution. |

### Why this is a clean boundary, not an overlap

The survey read STORY-92's terminal clause — *"an unresolved licence cannot ship
as product"* — as specifying a refusal whose enforcement point is CAP-82's
`deploy` command, since CAP-82's scope explicitly claims *"what a deploy reports,
what it refuses"*. That reading is about the story's **prose**, not its surface.
Checked against both the ACs and the code, the two surfaces are disjoint.

**The evidence.**

- *The enforcement point is a different command.* The gate is `1c fonts check`
  (`tools/generate/src/cli/fonts.ts` -> `cmdFontsCheck`, dispatched at
  `tools/generate/src/cli/index.ts:976`). Its only callers are that subcommand
  and its tests — nothing in `tools/generate/src/deploy/` imports or invokes it.
- *The deploy path holds no licence gate.* `tools/generate/src/deploy/*.ts`
  contains no reference to fonts, licences, provenance or redistribution beyond
  four `font/woff`-style MIME-type entries in `r2.ts`. `config.distribution` —
  the marker that selects the strict bar — appears nowhere in the deploy path;
  its single occurrence outside `fonts.ts` is the `fonts check` usage text.
  `cmdDeploy` (`cli/index.ts:454`) validates only `--channel`, `--dry-run` and
  `--prune`.
- *Neither story's ACs cross.* STORY-92's twelve ACs (AC-857...AC-868) are all
  written against "the check" — the record's contract, the four violation kinds,
  the warning channel, the distribution marker, the report and its `--json`
  form. STORY-94's thirteen ACs (AC-892...AC-926) are all deploy mechanics. No AC
  in either story names the other's subject.
- *The story itself disclaims the crossing.* STORY-92's out-of-scope section
  rules out "any enforcement on a published page at serving time" and states
  "This is a build-time compliance boundary."

**The reading that resolves it.** "Ship" in STORY-92's title names the
**obligation being protected** — redistribution across customer domains — not
the command where enforcement lands. The check answers *"are these bytes clear
to be shipped as product?"* at build time, independently of whether any deploy
is ever run. CAP-89 owns the record and the question; CAP-82 owns the act of
shipping. Each capability's claim is satisfied without touching the other's.

The division is the same one STORY-92 already draws internally between
provenance and binding: the substrate binds a family handle to a file (pixels),
the record states what its licence permits (obligations). Adding a third axis —
who *enforces* — lands the check in CAP-89 with the record it validates, because
the check has no delivery machinery in it at all.

### Latent risk flagged for regression

The overlap is currently only in the prose, but it is a real seam waiting for a
future story. If the fonts check is ever wired into `1c deploy` as a genuine
pre-ship gate — a deploy that refuses a product-distributed site with an
unsettled redistribution answer — that story would sit squarely on this
boundary, and the split should be:

- the **refusal at the deploy command** (what deploy checks, how it reports the
  refusal, what exit status it carries) -> CAP-82, whose scope already claims
  "what a deploy reports, what it refuses";
- the **record, its contract, and the meaning of the three-state answer** ->
  CAP-89, unchanged.

No such story exists today, so no reassignment is warranted now. Recorded here
so the seam is not rediscovered from scratch at the next survey.
