---
uid: comment-00bc291f
id: COMMENT-882
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T10:35:23.954865+00:00'
updated_at: '2026-08-09T10:35:23.954865+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-af23e299
  kind: note
---

AC-level alignment check complete. **REPORT-1734 (`report-af23e299`) — PASS**: 0 violations, 1 warning, 0 needs_review. Schema verified (`result=pass` top-level; `report_kind`, `subject_uid`, `level=ac`, and the three integer counts all present).

## What I checked

3 stories, 36 ACs — all `feature`/`upgrade`, so all in matrix scope and all expected to have ACs:

| Story | Kind | ACs |
|---|---|---|
| STORY-94 — snapshot deploy | upgrade | 13 |
| STORY-95 — serving previews/published | upgrade | 14 |
| STORY-96 — clean page URLs | feature | 9 |

Per the level cascade I used story bodies as the working reference, consulting intent only to confirm provenance of the store-tree ACs. Intent resolves through two bundles, both `free_and_reconciled`: BUNDLE-13 (REQ-110/111/113 → the three stories) and BUNDLE-14 (BUG-31 → the store-tree ACs).

## Result

Every in-scope bullet in all three story bodies maps to at least one AC; no AC describes behaviour its story excludes; no two ACs within a story restate the same criterion.

The one warning: **AC-913** pins the apex holding response and that the apex never serves a site's snapshot — but STORY-95 mentions the apex only inside its *Out of scope* clause. The AC isn't contradicted (the parenthetical asserts exactly that behaviour), but an active UAT-covered AC sourced from an exclusion clause reads as unowned. Resolution category `story-body-edit`.

Three overlaps I examined and deliberately did **not** call duplicates: AC-924/AC-926 map to distinct clauses of one story bullet with different channels and fixtures; AC-905/AC-927 and AC-906/AC-910 each explicitly disclaim the other's territory in their own bodies.

## Two things worth flagging beyond the verdict

**For the uat-level pass:** AC-914, AC-918 and AC-908 each state in-body that they are proven below the end-to-end boundary (the reserved-segment collision is unreachable while rendered output stays flat; shapes the flat render can't emit are seeded directly). That's transparent and consistent at AC level, but "does the test exercise a real entry point" is the uat-level question — these three are where to look.

**Tooling problem that shaped this run:** `xgd ticket list --filter` and `xgd ticket query` are both unusable in this repo right now. Each forces a cold-index rebuild and times out after 30s on the exclusive flock at `main/.xgd/_locks/__cold_index__.flock`, held near-continuously by PID 28114 (the port-5555 dashboard, running at ~54% CPU; the index files are being rewritten every few seconds). `xgd ticket get` and `xgd ticket children` are unaffected. I enumerated UIDs by reading `.xgd/tickets/{hot,cold}/index.json`, then fetched every ticket's authoritative content via `xgd ticket get --json` — no conclusion in the report rests on the index files. I did not touch the dashboard process, since killing an operator process is outside a read-only assessment. This is recorded in the report's editor notes; it will hit any other workflow step that lists or queries tickets until that process is restarted.
