---
uid: comment-712d6a70
id: COMMENT-860
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:28:36.057356+00:00'
updated_at: '2026-08-09T01:28:36.057356+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cbad1c8b
  kind: note
---

Cluster 5 is resolved. Verified: 15 ACs, each with exactly one `story_uid`; working tree clean.

## Verdict: both stories confirmed in place, one AC reassigned

The boundary between these capabilities is real and **already documented in agreement on both sides** — the survey caught a genuine dependency, not an ambiguity.

- **STORY-80** (`story-c490f1cf`, CAP-70 Framework Substrate) — the palette colour **model**: palette shape, colour axes accepting literal-or-reference, translucency as a reference axis, dangling refs failing validation, resolution at the load boundary.
- **STORY-97** (`story-5e7eb0c5`, CAP-89 Site Materials) — the **migration onto** it: `1c colors` census, `--assign` retrofit, palette derivation, lossless-or-refuse write.

CAP-89's scope claims the census/retrofit and disclaims the model; STORY-80's notes disclaim the tooling; STORY-97 names STORY-80 as its dependency. Model → migration is the correct ordering, so both stay put.

## The one place the boundary actually leaked

**AC-932** ("A retrofitted site's palette is materially smaller than its distinct colour count") sat under STORY-80 but is entirely about the migration — its criterion opens *"Converting an existing site's colour literals…"*, its verification compares pre/post-conversion definitions, and its UAT stages the real stored sites and drives `cmdColorsAssign`. It exercises no model-only behaviour.

The decisive point: it can't be satisfied unless the retrofit tooling exists, which made CAP-70's UAT coverage hostage to CAP-89's tooling. Moved to `story-5e7eb0c5`.

Reassigned rather than archived as a duplicate — STORY-97's ACs cover the *mechanism* (AC-941/943/944), but only AC-932 asserts the measured outcome on real sites (`xgd` 6 entries from 16 distinct RGB, `gigabytealchemy` 8 from 30) and that colourless sites carry no palette.

I also checked **AC-930 vs AC-942**, which look duplicative but aren't: AC-930's load-bearing assertions are model invariants (entry stays opaque, `resolveL1Color` round-trips every alpha byte), AC-942 asserts the producing side. STORY-97's own technical context anticipates this pairing. Left unchanged.

## Two things worth flagging

- **No test rename was needed** — AC numbers are global, so `test_UAT_AC932_*` still satisfies the convention, and the AC→UAT link is by function name, not file path.
- **Residue I deliberately did not action**: AC-932's UAT still lives in `tests/reconciliation-colour-palette-overlay.test.ts`, whose header reads "Reconciliation UATs for story-c490f1cf". It belongs in the census/retrofit test file (which already has every helper but `loadSite`). I left it — relocating test code is a source change outside this mandate, risks a regression-branch break, and buys no matrix benefit. It's recorded in the report for a later tidy-up.

Only mutation: the single `fields.story_uid` field on AC-932 (commit `79e6931c3`). No code changed, so I ran no test suite. Report `report-cbad1c8b` created with `report_kind=overlap_resolution`, `subject_uid=report-69e94af9`, `cluster_id="5"`, result `pass`.
