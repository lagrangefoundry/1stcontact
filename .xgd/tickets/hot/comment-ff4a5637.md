---
uid: comment-ff4a5637
id: COMMENT-7792
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-04T21:18:00.139618+00:00'
updated_at: '2026-11-04T21:18:00.139618+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7aeed3cd
  kind: note
---

I've fixed all seven blocking gaps from review report-d91ea163 and all but one of the lower-severity items. I didn't run any tests, as the fixer instructions say; the workflow runs the full suite next. The completion report is filed as REPORT-10936 (`needs_more_work=false`, `progress_made=true`). There was no FC-orphan report for this bundle, so no FC test files were renamed or deleted.

**The seven blocking gaps:**
1. **AC-2236 (preflight compatibility check):** I made one small production change in `tools/generate/src/cli/shared-store.ts`. The real probe is now `knowledgeSeamProbe(load)`, and only the loading of the knowledge module can be swapped out; default behaviour is unchanged.
   - The UAT now runs the real detection against stand-in components: one with no `indexFor`, one that ignores the map, one that returns the wrong index, and one that throws.
   - It also checks the probe makes no network call and doesn't use the embedder.
   - A new UAT runs `1c preflight` with the knowledge component missing. It expects exit 6 and the presence error, with no `Index seam:` line and the seam check never called.
2. **AC-2235 (build completes):** I narrowed the AC text rather than driving the CLI. `1c kb build` and `bin/kb-release` write into the repo's real `kb/` directory and need the real embedder credential. The CLI exit code and the release run are now recorded as an operator check.
3. **AC-2237 (passage search per knowledge base):** the Worker UAT now calls `chunk_search` on each knowledge base and checks which document comes back and its passage text.
4. **AC-2250 (other addresses):** new Workers UAT, `tests/reconciliation-contact-other-addresses.workers.test.ts`, calls `GET /api/people/detail` through the real router. It checks every address comes back, primary first.
5. **AC-2242 (erasure):** reworded to future tense, with a decision on story-fde7370b that business erasure isn't built yet. The "nothing stranded" test now compares the whole storage bucket before and after, replacing the check that did nothing.
6. **story-a55c2f35 (name redaction):** reworded. `redactNames` is now described as a helper that nothing in the product calls yet, and that's recorded as a decision.
7. **story-0034d937 (name sort):** added a decision that REQ-193's sort by name isn't built; the list still orders by creation time.

**Lower-severity items, all done except AC-2257:**
- **Text corrections:** story-83ff6262, story-4630e921, AC-2320 (five addresses, not six), and AC-2281 plus story-7d255580 (now cite commit c967412886).
- **story-5b5be809:** recorded why REQ-192's "xgd site byte-identical after a wipe" clause is an operator check rather than an AC.
- **New assertions:**
  - AC-2269 is now also checked through the route, which answers 404 for another business's contact.
  - AC-2270 checks that History sits directly after Businesses.
  - AC-2239's scan now also checks `crypto.randomUUID` callers; the only two make values that aren't row keys.
- **Wording and renames:** AC-1448 now says the retained draft is keyed by site id. I renamed the two stale test names for AC-2157 and AC-2188.
- **Left as is:** the advisory AC-2257 scan.

**Risks and open items:**
- **New test risk:** the new preflight test swaps the shared-store module using `vi.doMock`. If vitest doesn't match the module id, that test will fail.
- **Typecheck:** `tools/generate` shows 8 errors, all in control-app files I didn't touch; none are in the changed files.
- **For the operator:** the review's two other notes still need a decision.
  - The guard tripped by `vitest.node.config.mts` needs a ruling.
  - Its recommendation to add an AC requiring HTML-escaping in `renderTemplate` should be settled before REQ-199 lands.