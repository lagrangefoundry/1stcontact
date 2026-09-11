---
uid: report-f9e925b8
id: REPORT-3871
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-11T02:18:30.819149+00:00'
updated_at: '2026-09-11T02:18:30.819149+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-87be4669
  plan_item_index: '1'
---

Mutations applied. Evidence note: this worktree's HEAD does not yet carry REQ-164's code (the outer reconcile hasn't cherry-picked `858d63202f`; `kb.ts` at HEAD still has `INCLUDE_FIELD`/`optedIn` and the restrictive `corpus` predicate, with REQ-165's projection work layered on top). I read the landed behaviour from `git show 858d63202f` — `kb.ts`, `cli/index.ts`, `kb/knowledge_bases.json` and the 12 UATs in `tests/test_UAT_FC_REQ-164_corpus_export.test.ts` — cross-checked against the intent's own body and its "What landed" record in `bundle-87be4669`.

```
Upgrade mutations applied for plan item 1 of 17

Target Stories: story-c4f329d3
Primary Story UID: story-c4f329d3
Stories Modified: 1
ACs Modified: 4
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-c4f329d3"          # STORY-117, story_kind feature -> upgrade
  acceptance_criteria:
    modified: ["acceptance_criterion-3ae69518",   # AC-1295 membership is the kind
               "acceptance_criterion-54bad87d",   # AC-1300 refusal names the kind
               "acceptance_criterion-9926d333",   # AC-1293 corpus against ticket count
               "acceptance_criterion-9030cb80"]   # AC-1296 skip line names the marker
    added:    ["acceptance_criterion-b1dc1e0b",   # AC-1632 unrestricted corpus
               "acceptance_criterion-4a58856c"]   # AC-1633 exhaustive listing
    removed:  []

Progress: 1 of 17 plan items complete
```

What changed, and why:

- **STORY-117 body** — the "Membership, opt-in, per document" bullet is restated as *membership is a kind*: single-valued `doc_kind: system_kb`, with the retired boolean superseded rather than deprecated. The inclusion-not-exclusion and fail-safe reasoning survives intact. "The declaration is the thing in force" now says the shipped **and scaffolded** corpus declarations restrict nothing, with the build-time-filter-rerun-as-membership-rule argument. Two new in-scope bullets cover exhaustive listing/truncation refusal and the visible-not-inferred short corpus. A `## Reconciliation Decisions` section (dated 2026-09-10) records four decisions: status is no longer pure-filesystem, the envelope check is formalised beyond the intent's stated acceptance scope, unknown-not-zero is intent rather than defensive coding, and the boolean is superseded rather than kept alongside.
- **AC-1295** — five out-states including the retired boolean explicitly named as *not* membership.
- **AC-1300** — refusal names the kind field, the member value and the document type; the count-not-list exception is stated where it actually applies.
- **AC-1293** — three corpus-line shapes: agreement, stale-with-`1c kb export`-named, and store-unreadable-as-unknown (never zero).
- **AC-1296** — the skip line names the field and value that would admit the skipped document.
- **AC-1632 / AC-1633** — the two genuinely new behaviours, both stated at the CLI/declaration boundary with no internal symbols.

Left deliberately untouched: **AC-1305** (the declaration contract) — its claim is conditional ("every *declared* value is what the build uses"), which the unrestricted shipped corpus does not falsify; and **AC-1291**, which plan item 3 (REQ-158 bundle emission) owns. No runtime code was modified — `git status` shows only ticket-store bookkeeping.
