---
uid: comment-07697e16
id: COMMENT-866
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:46:20.139271+00:00'
updated_at: '2026-08-09T01:46:20.139271+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-15e47fdf
  kind: note
---

Cluster 10 resolved. Report **REPORT-1719** (`report-15e47fdf`) created with `cluster_id: "10"`, `result: pass` — matching the shape of the prior cluster reports.

## Resolution: Confirm both, no ticket changes

| Story | Action | Capability |
|---|---|---|
| story-8685be2d (STORY-92) — font provenance | **confirm** | CAP-89 Site Materials (unchanged) |
| story-5349d01f (STORY-94) — snapshot deploy | **confirm** | CAP-82 Site Delivery (unchanged) |

The survey flagged this because STORY-92's title ends *"an unresolved licence cannot ship as product"*, and CAP-82's scope explicitly claims *"what a deploy reports, what it refuses"* — so provenance appeared to specify a refusal that delivery's command would have to enforce.

I checked that against the ACs and the code rather than the prose, and the surfaces are disjoint:

- The gate is `1c fonts check` — `cmdFontsCheck` in `tools/generate/src/cli/fonts.ts`, dispatched at `tools/generate/src/cli/index.ts:976`. Its only callers are that subcommand and its tests.
- Nothing in `tools/generate/src/deploy/` imports or calls it. The only font-related strings in that whole directory are four MIME-type entries in `r2.ts`. `config.distribution` — the marker selecting the strict licence bar — never appears in the deploy path; its one occurrence outside `fonts.ts` is the `fonts check` usage text. `cmdDeploy` validates only `--channel`, `--dry-run`, `--prune`.
- STORY-92's twelve ACs (AC-857…AC-868) are all written against the check; STORY-94's thirteen (AC-892…AC-926) are all deploy mechanics. Neither names the other's subject.
- STORY-92's own body rules out serving-time enforcement and calls itself "a build-time compliance boundary."

"Ship" in STORY-92 names the obligation being protected — redistribution across customer domains — not the command where enforcement lands. CAP-89 owns the record and the question; CAP-82 owns the act of shipping.

One thing worth carrying forward: the seam is real even though it's currently only in the prose. I recorded in the report that if the fonts check is ever wired into `1c deploy` as an actual pre-ship gate, the refusal behaviour belongs in CAP-82 and the record/three-state contract stays in CAP-89 — so the next survey doesn't rediscover this from scratch.
