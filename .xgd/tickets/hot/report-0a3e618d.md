---
uid: report-0a3e618d
id: REPORT-2362
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-20T04:18:40.150348+00:00'
updated_at: '2026-08-20T04:18:40.150348+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-77b28def
  plan_item_index: '6'
---

Story created and verified; working tree is clean.

**What grounded it**: read REQ-123's body and its chat transcript comment first (the spec: opt-in-on-the-document membership and *why* inclusion not exclusion; the generated-not-authored map; `authored` at runtime as the shipped-KB contract; one embedding model on both sides), then `tools/generate/src/cli/kb.ts`, the `kb` dispatch in `cli/index.ts`, `kb/knowledge_bases.json` and `tests/test_UAT_FC_REQ-123_system_kb.test.ts`.

**Divergences recorded in Technical Context rather than absorbed into ACs:**
- The intent names the declaration `knowledge_bases.yaml`; what shipped is JSON (so no YAML parser is injected). Same file, same role.
- The "name it, never count it" rule holds for the export's exclusions but *not* for the empty-corpus build refusal, which reports a count. Flagged so nobody "fixes" one of the two into inconsistency.
- `DocDirStore` ignoring frontmatter timestamps is why "an unchanged document is not rewritten" is a correctness property, not an optimisation.

Scope boundary held: what a *session* does with the KB (priming, degradation, the read-only grant) is deliberately left to plan item 7's upgrade of STORY-103, and the story says so explicitly.

```
Story #6 created for reconciliation bundle-77b28def

Story UID: story-c4f329d3 (STORY-117)
Title: System knowledge base: build the assistant's domain knowledge from our own documents, with each document deciding whether it is in
Type: feature
Capability: CAP-100 (capability-45acba5e) — created, System Knowledge Base: The Corpus, Its Index & Its Generated Map
Acceptance Criteria: 16 created (AC-1291 … AC-1306)

Progress: 6 of 9 plan items complete
```
