---
uid: comment-9122add8
id: COMMENT-2613
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T21:49:43.240741+00:00'
updated_at: '2026-09-10T21:49:43.240741+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-526644f5
  kind: note
---

## UAT Coverage Assessment — CAP-90 (`ai_site_assistant`): **FAIL**

**REPORT-3803** (`report-526644f5`) — 3 violations, 3 warnings, 0 needs_review.

**Verdicts written**: 20 AC pass, 3 AC fail (AC-1317/1318/1319), story `fail`, capability `fail`. Twelve ACs carried *no* `uat_coverage` value before this call — the capability's `pass` came from REPORT-2075 (2026-08-16), which assessed eleven ACs and predates both the 2026-08-20 knowledge ACs and the 2026-08-31 BUNDLE-20/21 ACs. Stale aggregate, not evidence.

**Why it fails.** Not a missing or weak test anywhere. Three of the four knowledge UATs error against the shared library that is actually installed, and one of them errors because the production wiring is broken:

1. `tools/generate/src/cli/ai/host.ts:160` calls `bridge.KnowledgeDocs.open(...)`; `@lagrangefoundry/ai-knowledge` no longer exports `KnowledgeDocs` (priming moved to `landscapeProvider` / `mechanismProvider` / `registerKmProviders`). Any workspace with a built system KB throws on open. → **code-issue**
2. AC-1318 pins the grant to "exactly the three read operations"; upstream now declares five, all `effect: read` in the one `ReadKnowledge` group. Intent's property (read-only, one declaration, both axes) is intact — the count went stale. → **ac-edit**
3. AC-1317 asserts `DECLARATION.operations[].returns.provenance`; provenance moved onto the knowledge base upstream. Everything before that line worked against the real library — the surface composes and a real search returned `DOC-A`. → **uat-edit**

All three are one upstream event seen three ways, and the shared store isn't pinned by this repo's lockfile.

**What I executed**: the artifact suite passes 3/3 live (AC-1406/1407/1410); the knowledge suite runs and fails 3 of 4. The other three suites cannot start in this sandbox — `EPERM: listen 0.0.0.0` from `builder.ts:363`, and the workerd pool binds a port too — so their 20 verdicts are reading-based per Step 1b, and I say so in the report rather than implying they are green. `@lagrangefoundry/ai` itself is in sync (the artifact suite loaded its Workers rung and found every expected symbol), which bounds the drift to the knowledge package.

Warnings (non-blocking): AC-1319's case assembles priming itself rather than reading what a conversation was primed with — the exact seam finding 1 broke unobserved; the story's mid-turn junction bound has no direct observable; and AC-1320's case still displaces the repository's own KB index during the run.
