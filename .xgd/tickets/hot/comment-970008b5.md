---
uid: comment-970008b5
id: COMMENT-878
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T07:06:53.054402+00:00'
updated_at: '2026-08-09T07:06:53.054402+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f17c1ea6
  kind: note
---

**REPORT-1730 (`report-f17c1ea6`) — FAIL: 5 violations, 3 warnings, 0 needs_review.** Schema verified: top-level `result: fail`, `report_kind: capability_validation`, `subject_uid: capability-2049c9ec`, `level: ac`, integer counts.

## What I found

CAP-71 holds two upgrade stories with 16 active ACs each. **Nothing has been repaired since the last cycle** — all 32 ACs and both story bodies were last written 2026-08-07T23:54 (the `uat_coverage` field stamping, no body text changed), and no capability_validation report for this subject exists after that. This is attempt 6 against a substantively unchanged matrix.

**Violations (all re-derived and re-verified against code in this worktree, not inherited):**

1. **STORY-86 — pinned-box content overflow uncovered** (`ac-add`). The story body names three envelope violations; `probes.ts:405-416` raises the third as a `clip` finding. No AC mentions it — a grep for "overflow" across all 32 AC bodies hits only AC-734's title. **Third raise** (REPORT-1319 → REPORT-1658 → here). Fully self-contained; no story-level dependency.
2. **AC-691 incomplete vs BUG-18** (`ac-edit`) — the per-width type-axis track (`responsiveTextTracks`, `fold.ts:605-640`) is expressed by no AC.
3. **AC-731 contradicts BUG-14, misses BUG-19, conflicts with AC-812** (`ac-edit`) — per-run backing boxes vs. band/card grouping; page base by run count vs. total band height.
4. **BUG-17 padding uncovered** (`ac-add`) — `foldPadding` ships at three call sites; "padding" appears in zero AC bodies.
5. **BUG-20/21 self-painting runs uncovered** (`ac-add`) — `isSelfPaintingRun`/`chipAxes` ship; "chip"/"pill"/"badge" appear in zero AC bodies.

Warnings: AC-710 stale text-only wording, AC-705↔AC-710 duplicated report shape, AC-729↔AC-733 duplicated source-less-media criterion.

**One correction carried into the report:** REPORT-1658 called AC-691 a contradiction whose faithful UAT would fail against real code. That is wrong — `fold.ts:1729` still takes the scalar from the widest cell, and the track is built so the widest keyframe equals it. AC-691 is true but incomplete; the repair is an extension, and an editor who deletes the widest-sample sentence makes it wrong in the other direction. The claim holds for AC-731.

Two operational notes: the ticket index is under heavy lock contention from the dashboard (PID 28114) and dispatcher (PID 22505) — `xgd ticket list` times out after 30s waiting on the cold-index flock, so I read the store through the `xgd_source.core.ticketing` module instead. And the claude.ai Gmail/Calendar/Drive MCP servers need authorizing via your claude.ai connector settings before their tools are usable; nothing in this task needed them.
