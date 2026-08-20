---
uid: comment-306a26ae
id: COMMENT-1289
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T10:57:04.724978+00:00'
updated_at: '2026-08-20T10:57:04.724978+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-41a23f6e
  kind: note
---

Report **REPORT-2419** (`report-41a23f6e`) created — **FAIL**: 3 violations, 1 warning, 1 needs_review. Schema verified (`report_kind`, `subject_uid`, `level=story`, integer counts).

## What drove the verdict

The stories' own provenance chain is unusable: both stories carry a single scalar `updated_by`, and **all 34 ACs carry `intent_uid: None`**. The chain names 3 tickets where ~20 reconciled intents actually shaped the code. I rebuilt the ledger from the bug/request corpus plus the `REQ-`/`BUG-` attributions carried in the implementation — that reconstruction is what exposed the drift.

**Violation 1 — STORY-84, coverage.** REQ-88 (`free_and_reconciled`, completed 2026-08-05) is the largest single intent shaping this fold — **33 attributions in `tools/generate/src/l1/fold.ts`** — and appears in neither the story body nor any of its 18 ACs. Four folded behaviors are unexpressed: per-side padding (`foldPadding()`, `fold.ts:552`), per-width padding tracks (`fold.ts:654`), `axes.nowrapFromPx` (`fold.ts:1842`), and the recovered centred content column (`fold.ts:335`, `schema.ts:1352`).

**Violation 2 — STORY-84, coverage.** BUG-18 made the fold keyframe *non-geometry* text axes per width (`responsiveTextTracks()`, `fold.ts:623`). The story still describes keyframing as geometry-only, and AC-691 states the widest-sample rule as the whole rule — which is BUG-18's root-cause description almost verbatim.

**Violation 3 — STORY-86, consistency.** The 2026-08-05 consolidation merged CAP-73 into CAP-71, but STORY-86 still refers to CAP-71 as an *external* capability in five places — including an Out-of-scope line that declares its own capability's other half out of scope. It also attributes values-diff pairing to CAP-72, which is "Behavior Module Contract & Catalog" (deprecated); that work belongs to CAP-63.

**needs_review — `1c repro`.** REQ-88 §1's verb exists (`cli/index.ts:557`) but a scan of **all 31 stories across every capability** finds no story expressing it. The behavior is unambiguously active; only its ownership (CAP-71 vs CAP-82/CAP-89) is unsettled, so I escalated rather than guessed.

Two notes for whoever picks this up: findings 1 and 2 are one omission wearing two hats — the story describes the fold as "geometry is responsive, everything else is flat from the widest sample," which was true at REQ-83 and has since been broken twice; the fold now has a general varying-scalar-becomes-a-track mechanism worth stating once rather than enumerating per axis family. And I checked REQ-90's resource table before filing anything: it is fonts-only in both matrix and schema, so the story's font-only description is correct, not drift.

Constraints respected — no tickets, tests, or code modified; scratch files are under `.xgd/tmp/`. The `git push` in the report-create output failed on sandbox network restrictions; the report itself committed locally and reads back correctly.
