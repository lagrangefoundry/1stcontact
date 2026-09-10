---
uid: comment-2410544e
id: COMMENT-2494
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T08:06:14.019768+00:00'
updated_at: '2026-09-10T08:06:14.019768+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-bea33050
  kind: note
---

**Assessment complete — CAP-100 passes.** Report: `REPORT-3695` (`report-bea33050`).

**Verdicts written**: 16 ACs `pass`, STORY-117 `pass`, CAP-100 `pass`. 0 violations, 3 warnings, 0 needs_review.

**Intent ledger.** One reconciled intent governs this capability: REQ-123 (`free_and_reconciled`, via BUNDLE-19 at `b18b859d`). Six further requests touch the KB (REQ-158/159/160/163/164/166) but all are `draft` — not yet active, and none retires a shipped behavior. Nothing is stale; nothing is unreviewed.

**Coverage.** Every in-scope bullet of the story body maps to an AC, and all sixteen ACs have live tests in `tests/reconciliation-system-knowledge-base.test.ts`. I ran them: **16/16 pass** in 8.5s. The one story-body claim whose evidence sits outside this capability — the query half of "one embedding model on both sides" — is exercised by the assistant capability's suite through `openKnowledgeRuntime`, which resolves the same `resolveEmbedder` seam the build uses; the story explicitly assigns the session surface there, so that's AC-elsewhere, not a gap.

**Evidence validity holds.** Three stand-ins only, each at a seam production already ships: the embedding model and the describer via the env vars `resolveEmbedder`/`resolveDescriber` read, and the ticket store as a `PATH` shim over a subprocess boundary. Real `DocDirStore`, real index and chunk builds, real cosine search, real clustering, real access-point validation, real CLI dispatch. Notably, every real-store assertion is paired with a seeded one — the suite's own comments record that the real store has been all-opted-in and once all-opted-out, which would have turned the read-back loops green over an empty set.

**The three warnings** are assertion-tightening in one file, not missing evidence:

1. AC-1300 — `toContain('doc')` at line 711 is satisfied by the word "documents" elsewhere in the same message, so it doesn't actually pin "names the document kind."
2. AC-1303 — nothing observes that access points were validated by *the reader's* search; swapping `find` for a different query path would leave all current assertions green.
3. AC-1294 — the "nothing touched" snapshot is one directory level deep, so a write inside `kb/system/` would be invisible to it.

I also flagged one thing for the editor **not** to change: `exportCorpus` filtering on the constant `INCLUDE_FIELD` rather than the declaration's predicate looks like a divergence from AC-1305 but is a documented two-gate design — the export decides which files exist, the declared predicate decides membership at resolve time. Both name the same field.
