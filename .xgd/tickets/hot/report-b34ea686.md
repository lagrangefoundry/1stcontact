---
uid: report-b34ea686
id: REPORT-3693
type: report
title: 'Fix System Knowledge Base: The Corpus, Its Index & Its Generated Map (uat)
  — attempt 2'
created_by: xgd
created_at: '2026-09-10T07:52:44.233298+00:00'
updated_at: '2026-09-10T07:52:44.233298+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-45acba5e
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — System Knowledge Base: The Corpus, Its Index & Its Generated Map (uat)

**Attempt**: 2
**Fixes applied this call**: 6
**Violations remaining**: 0
**Warnings remaining**: 0
**Needs more work**: false — everything I can resolve without an operator decision is done

Attempt 1 (report-ec97a368, commit `47fe3cc820`) closed all four violations.
This call closes both remaining warnings (findings 6 and 8) and the one `info`
finding (9). What is left is finding 5 alone, which is `needs_review` and is
forwarded unchanged for the second time — I have not guessed at it.

```
tests/reconciliation-system-knowledge-base.test.ts   16 passed (16), 0 skipped
```

Verified by execution this call, twice: once after the AC-1296 change and once
after the AC-1292 change. The repository's `kb/` tree is byte-unchanged
afterwards, checked both times (`ls kb/` → `knowledge_bases.json` alone, and a
clean `git status`).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1296 UAT (finding 6) | Now drives `cli(['kb','export'])` over the same opted-in/opted-out mixture and asserts the command's own stdout: the reason phrase `not in the KB (no fields.system_kb):` is present, each of DOC-OUT1/2/3 is named individually, and no bare count stands in for the names. Then asserts the line is absent **entirely** when nothing was excluded |
| 2 | test-infra | `withRepoCorpus` helper | New helper enabling #1 and #3. `kb export` resolves its own repo-anchored root by design (a release artefact belongs to the repository, not to a caller's cwd), so a test that drives the command rather than the function beneath it cannot point it at a scratch tree. The helper moves the built corpus aside and puts it back in a `finally`, so asserting the command's output cannot cost a developer the corpus they had built |
| 3 | uat-edit | AC-1292 UAT (finding 9) | The AC says "Run the corpus-only form"; the test mirrored that form's body (`ensureConfig(root)` then `exportCorpus(root)`) rather than invoking it. It now drives `1c kb export` for real with all five credentials stripped, and asserts the same coherent tree — documents plus declaration, no index, no chunks, no map. The mirror is kept alongside it, since it is the half that can assert against a scratch root. Finding 9's recorded risk — "a future divergence between the command and its mirror is not silent" — is now covered rather than merely recorded |
| 4 | uat-edit (retire) | `tests/test_UAT_FC_REQ-123_system_kb.test.ts` (finding 8) | Deleted. I re-verified the overlap before removing it: all fifteen of its scenarios map onto AC-traceable tests, including the two I was least sure of — `the_map_is_a_ticket_the_report_lookup_finds` is covered by AC-1304's `findAwarenessReport` assertions (`:462-465`), and `an_unchanged_document_keeps_its_file_stamp` by AC-1299's backdate-and-compare (`:612+`). No coverage lost. Also checked for dangling references: none outside `.xgd/` |
| 5 | uat-edit | Evidence file header | Records that this file is the evidence for AC-1291 … AC-1306 in full, that it absorbed the retired duplicate, and why — so the next reader knows which file is authoritative rather than re-creating the second one |
| 6 | ac-edit | AC-1296 | Verification sharpened to require driving the command form and asserting the reason text, paired with #1 so the matrix and its evidence agree at this call boundary. AC-1292 needed no edit — its Verification already said "Run the corpus-only form"; the test was what did not match, and #3 fixed the test rather than weakening the AC |

## Code Edits

None this call. The two production edits were attempt 1's (`kb.ts:583`, `kb.ts:725-733`),
reported in report-ec97a368 and unchanged since.

## Regression Check

The two adjacent suites that consume `openKnowledgeRuntime` are **6 failed / 20 passed**,
identical to where attempt 1 left them (they were 7 failed before attempt 1's fix,
6 after; this call did not move them either way). Those 6 are pre-existing upstream
drift in a **different capability** — the assistant's session-knowledge surface,
AC-1317 … AC-1320 — from two causes, both the same class as finding 2:

- the knowledge grant's tool set gained `KnowledgeChanges` and `KnowledgeOutline`
  upstream, so three tests asserting an exact three-name set now fail;
- `KnowledgeDocs` is no longer exported by `@lagrangefoundry/ai-knowledge`, so two
  priming tests throw `Cannot read properties of undefined (reading 'open')`.

I did not touch them: they belong to another capability's matrix, and at least
AC-1318's grant list may need an `ac-edit` rather than a test fix — which is that
capability's assessor's call, not mine. **Flagging them so they are not mistaken for
fallout from this work.**

## needs_review Items Forwarded (unchanged from attempt 1)

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-1295, AC-1296, STORY-117 (finding 5) | The matrix and mainline code say membership is `fields.system_kb: true` (REQ-123, `free_and_reconciled`), but all 38 `doc` tickets had that flag cleared on 2026-08-31 ahead of REQ-164 — which is still `draft` and blocked on xgd REQ-827, so by the status table its `doc_kind` rule does not count toward cumulative intent. A free-coded implementation exists on `origin/reconcile-BUNDLE-23` (`2db8ee6b90`) but on neither this branch nor `origin/main` | Either activate/reconcile REQ-164 — then AC-1295 and AC-1296 need an `ac-edit` to a closed-enum `doc_kind` rule (losing the genuine-boolean shape assertions) and STORY-117 a `story-body-edit` — or restore the boolean on the intended documents. My edits across both attempts are deliberately neutral on it: every AC is now proven over a seeded corpus asserting the rule REQ-123 governs, while the real store is asserted only for agreement, which holds under either rule and at zero documents. **The system KB still builds an empty corpus on this branch and `1c kb build` still refuses with the AC-1300 message** — unchanged, and the operator's to settle |

## Why `needs_more_work: false`

Findings 1, 2, 3, 4 (violations), 6, 7, 8 (warnings) and 9 (info) are all resolved
and verified by execution. Finding 5 is `needs_review` and cannot be resolved
without an operator decision on REQ-164 — guessing at it is the one thing this
prompt tells me not to do. There is no remaining work I can do that would leave the
matrix in a more valid state, so the assessor should verify rather than the loop
re-invoking me.
