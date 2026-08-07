---
uid: comment-c1ceee88
id: COMMENT-823
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T22:44:59.406151+00:00'
updated_at: '2026-08-07T22:44:59.406151+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f150ba1e
  kind: note
---

Report **REPORT-1643** (`report-f150ba1e`) created — schema verified: `result: fail`, `report_kind: capability_validation`, `subject_uid: capability-aa030c83`, `level: story`, violations 8, warnings 1, needs_review 0.

## Verdict: FAIL

The five stories describe the intent they *do* cover accurately. The failure is almost entirely **coverage** — seven reconciled intents whose behaviour is live in production code, inside this capability's own declared scope, are expressed in no story.

**Violations**

1. **CAP-63 body is stale** — Scope bullet 4 covers only boolean-flag parsing and `--json` hygiene, but STORY-79 also carries flag propagation into sub-commands, the on-demand Astro container (REQ-89), and the dependency preflight (REQ-44, reconciled 2026-08-07 — two days after the body was last written).
2. **BUG-22** — split text+box control surface attribution (`values-diff.ts:137-144, 2103-2145`). A pairing rule, which is Scope bullet 1; STORY-75 item 4 covers duplicate-*text* pairing only.
3. **REQ-73** — the values-diff `gap` axis + band-padding suppression (`values-diff.ts:364,406,1406,2533`). Named in no story anywhere.
4. **REQ-72** — in-browser hexification of `oklch`/`oklab`/`color()` stop colours (`extract.ts:331-339,846,1132`). STORY-76's In-scope line ("capture of stop positions and surface gradients") excludes it by its own wording.
5. **BUG-24** — band-overlay capture across modern colour syntax (`extract.ts:1047-1057,1425`). STORY-75 item 9 *presupposes* this is true without any story stating it.
6. **BUG-25** — per-text-node run geometry for multi-run elements (`extract.ts:666-684,1101-1124`).
7. **BUG-16** — offline re-extract against mirrored faces (`reextract.ts:45-73,96-100`); also in tension with STORY-75 item 7, which frames `fontLoaded:false` as a tolerated artifact after BUG-16 fixed its dominant cause.
8. **REQ-76** — cause clustering, `--clusters`, dispositions (`fidelity.ts`, `index.ts:260,759-768`).

**Warning:** all five stories still name the pre-consolidation structure retired 2026-08-05 — STORY-78 claims to belong to CAP-65 (deprecated) while its own `capability_uid` is CAP-63; STORY-77 and STORY-79 cite CAP-63 as an external sibling under its old name.

**Two systemic roots**, both in the editor notes: BUNDLE-10 (`bundle-4ff83a8b`, reconciled 2026-07-29) is the only reconciled bundle appearing on **zero** stories across all 25 in the matrix — findings 2, 5, 6, 7 are all its members; and REQ-72/73/76 are named in no bundle body at all despite being reconciled and shipped. Worth re-walking BUNDLE-10 against CAP-70 and CAP-71 too, since the same hole plausibly cost them coverage.

No `code-issue` findings — every gap is the matrix failing to describe working code, verified at a named file:line rather than inferred from ticket text. I made no modifications to tickets, tests, or code.
