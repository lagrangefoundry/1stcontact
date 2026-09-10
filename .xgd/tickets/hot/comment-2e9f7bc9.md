---
uid: comment-2e9f7bc9
id: COMMENT-2491
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T07:48:06.595257+00:00'
updated_at: '2026-09-10T07:48:06.595257+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ec97a368
  kind: note
---

**Attempt 1 complete — all 4 violations resolved, verified by execution.**

The AC-traceable evidence file went from **5 failed / 6 passed / 5 skipped (one pass vacuous)** to **16 passed, 0 skipped**.

**Root cause (finding 1) was a live production defect.** `@lagrangefoundry/knowledge` moved `search()`/`searchChunks()` from a single `source` to an `indexes` map keyed by each KB's declared source name; `kb.ts:583` still passed the old shape, so `indexFor()` threw and **every** `1c kb build` failed — on `origin/main` too, not just here. Fixed there and at the three UAT call sites. I also checked `openKnowledgeRuntime` as the assessor suggested and it had the same defect *silently*: `KnowledgeRuntime.open` destructures `indexes`/`chunkIndexes` and ignores unknown keys, so the chat session's runtime was opening with no index rather than erroring.

**The other three violations:**
- AC-1305's assertion still read `binding.kb.prompt` after the framework's `prompt`→`description` rename — fixed, plus the paired ticket edits to AC-1305 and STORY-117's body so the matrix stops carrying the stale word.
- AC-1295 and AC-1297 took the live ticket store as a hard precondition. Since all 38 `doc` tickets had `system_kb` cleared, one failed loudly and one passed by looping over zero documents. Both now prove their claim over a seeded corpus that can't degrade to empty, while the real store is asserted for *agreement* — a property that holds at any size. AC-1295's and AC-1297's Verification sections were rewritten to match.

**Regression-checked rather than assumed:** I baselined the two adjacent suites by reverting `kb.ts` and re-running — 7 failed before, 6 after. Strictly better. The remaining 6 are pre-existing upstream drift in the adjacent assistant capability (`KnowledgeChanges`/`KnowledgeOutline` added to the grant, `KnowledgeDocs` no longer exported), out of scope here.

**Forwarded, not guessed:** finding 5 — whether membership is `fields.system_kb` (REQ-123, the governing intent) or `doc_kind` (REQ-164, still `draft` and blocked) is the operator's call. My edits are deliberately neutral on it, and the system KB still builds an empty corpus on this branch.

Two warnings remain for next iteration: AC-1296's reason-text assertion, and retiring the duplicate test file — I audited its overlap and confirmed all 15 scenarios are covered by AC-traceable tests, but held the deletion back to land as its own change rather than folding it into this batch. Committed as `47fe3cc820`; report `report-ec97a368`.
