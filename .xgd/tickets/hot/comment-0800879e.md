---
uid: comment-0800879e
id: COMMENT-1257
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T04:37:22.009490+00:00'
updated_at: '2026-08-20T04:37:22.009490+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c353409a
  kind: note
---

All 10 mutations landed and are committed. Working tree is clean.

## Attempt 7 — 10 mutations, 3 violations remaining

**STORY-76 closed entirely** (findings 7–10), prioritized because findings 8 and 9 were five cycles old and finding 9 regenerates unless the AC and story body are edited together — both were, in the same pass:

- **AC-638 edited** — stop colour narrowed to a `#hex` literal, palette-role alias moved to the *rejected* side per REQ-114. Direction clause left alone (`validate.ts:117-125` still accepts a degrees number or alias).
- **STORY-76 body edited** — the same stale "or a palette-role alias" clause removed from item 2's *Authored* bullet, and the Technical Context bullet asserting "literal-or-role" rewritten to the literal-only rule.
- **AC-1307** — REQ-72 in-browser stop-colour resolution to `#rrggbb`.
- **AC-1308** — the four-clause surface-gradient selection rule (nearest wins / skip text-fill / stop at first opaque / none records none).
- **AC-1309** — `resolveSurfaceGradient`, resolver-scoped and free of AC-637's deleted-module framing.
- **AC-637** — its deprecation was carried only in a `lifecycle` field that isn't in the schema, so it still listed as `active`. Set the durable top-level `status: deprecated`.

**STORY-75, three findings** (1, 2, 6): AC-1310 per-text-node run geometry; AC-1311 the surface-bearing box, both capture and diff-resolution halves with all four narrowness guards; AC-1312/AC-1313 the adjacent-gap axis and the paired band-padding retirement.

Every AC was written against code read at HEAD rather than the report's citations on trust — `validate.ts:96-107`, `text-style.ts:195-226`, `extract.ts:329-347/831-888/1101-1115`, `values-diff.ts:1129/1955/2493-2541/2575-2583`. One correction to the report: it cites `extract.ts` and `fidelity.ts` bare; they live under `tools/generate/src/cli/`. Line numbers matched.

**Remaining for next iteration**: findings 3 (capture-time font settling, three mechanisms), 4 (all-collapse band fallback), 5 (modern-syntax scrim colour probe), then warnings 12 and 13. Completion report is REPORT-2365 (`report-c353409a`) with `needs_more_work: true`, `progress_made: true`.
