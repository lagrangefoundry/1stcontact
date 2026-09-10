---
uid: report-c078cd4c
id: REPORT-3804
type: report
title: 'Fix UAT Coverage: AI Site Assistant: Per-Site Conversations — attempt 4'
created_by: xgd
created_at: '2026-09-10T22:04:24.280406+00:00'
updated_at: '2026-09-10T22:04:24.280406+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-7e4714b7
  fixes_applied: 8
  progress_made: true
  needs_more_work: true
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix UAT Coverage: AI Site Assistant: Per-Site Conversations

**Attempt**: 4
**Fixes applied**: 8
**Violations remaining**: 0
**Needs more work**: true (two warnings outstanding — findings 5 and 6)

The assessor's reading was correct in every particular, and its instruction to
treat the three violations as **one upstream event** is what this call did. All
three were `@lagrangefoundry/ai-knowledge` having moved since 2026-08-20: five
declared read operations instead of three, provenance relocated from the
operation onto the knowledge base that vouches for a document, and priming
replaced by two named providers. They were repaired as one pass against the
installed package, and no assertion was weakened to make a test pass.

**Everything claimed below was executed.** `reconciliation-assistant-conversation-knowledge`
now passes **4/4** (was 1/4). Six neighbouring node suites — the artifact suite,
`REQ-123`, `REQ-131`, the control surface, the worker-AI boundary and the draft
change journal — pass **67/67** together with it. The three `.workers.test.ts`
suites still cannot start under this sandbox (`EPERM: listen 0.0.0.0`), exactly
as the check reported.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue | AC-1319 / `host.ts` | Rewired the priming onto the provider API (`registerKmProviders`, `LANDSCAPE_PROVIDER`, `MECHANISM_PROVIDER`), preserving the ordering the criterion names. `KnowledgeDocs` is gone from the repo |
| 2 | code-issue | AC-1319 / `host-core.ts` | `HostDeps.priming` is now a provider descriptor; the priming ORDER moved into the role's entry list, where KM no longer owns it. Comment at the old `host-core.ts:425` rewritten to describe the wiring that exists |
| 3 | uat-edit | AC-1319 | Rewrote `test_UAT_AC1319_…` to OBSERVE rather than mirror: it opens a real conversation and takes a real turn through `nodeDeps` + `knowledgeDeps`, and asserts the order on `seen[0].system`. Verified adversarially — swapping the two entries in `host-core.ts` fails it (`expected 2553 to be less than 2258`); restored |
| 4 | ac-edit | AC-1318 | Criterion rewritten from the census ("exactly the three read operations") to the property: the offered set **is** the declaration's read group, and nothing in it writes |
| 5 | uat-edit | AC-1318 | The equality is now DERIVED from the declaration (`readGroupTools`) instead of hand-listed, so the next upstream addition is checked. `scope.document === scope.kb` was confirmed to still hold once the case reached it (it had never executed) |
| 6 | ac-edit / uat-edit | AC-1317 | Provenance re-asserted on what the call actually returns (the `UNTRUSTED_OPEN`/`CLOSE` wrapping) plus what the declaration now states — `origin` is a field of every returned shape. Criterion's stale three-operation enumeration de-censused. The audit half was left untouched, as advised |
| 7 | story-body-edit | STORY-103 | Technical Context: the priming-order bullet now records that the order is this host's since KM became two providers; a new bullet records that the assistant library is **not pinned by this repository** and why the criteria are written to properties rather than censuses (the assessor's third editor note) |
| 8 | uat-edit (out of the flagged set) | `test_UAT_FC_REQ-123_session_knowledge` | The same upstream drift had broken 2 of its 6 cases. Repaired identically — derived read group, and the priming case driven through the two providers. 6/6 now |

Field writes: AC-1317, AC-1318, AC-1319 `uat_coverage` → `pass`; STORY-103
`uat_coverage` → `pass`. All 23 ACs now read `pass`.

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/ai/host.ts` | 87–150 (`knowledgeDeps`, `nodeDeps`) | `bridge.KnowledgeDocs.open(...)` threw `TypeError: Cannot read properties of undefined (reading 'open')` against the installed package, reproduced here before any edit. AC-1319, REQ-123 and the installed declaration agree on the intended behaviour (map, purpose, manual). Rewired onto `registerKmProviders`; the knowledge pair is now one named function — `knowledgeDeps` — because the surface and the priming are one decision, and because a named seam is what a test can observe. `nodeDeps` exported for the same reason the Worker's `workerHost` is |
| `tools/generate/src/cli/ai/host-core.ts` | `HostDeps.priming` type; `build()`'s entry list; provider registration beside `REMINDER_PROVIDER`; two comments | KM's `landscapeText`/`mechanismText` render KM's own data and name no role, so the purpose entry and the sequence had to move here. The ordering is now declared in one visible list and is what AC-1319's UAT reads back off the model request |
| `tools/generate/src/cli/ai/roles.ts` | `CARETAKER_PURPOSE` | Moved from `host.ts`, where it was an argument to KM, to beside `CARETAKER_SYSTEM`, where it is now a priming entry of this host's own |

No behaviour was added or removed: the same three texts reach the model, in the
same order, with the manual still projected from the session's actual grant.

## Pre-existing failures, NOT introduced by this call

Verified by stashing every change and re-running: these three fail identically on
the clean tree.

| Suite | Case | Failure |
|---|---|---|
| `test_UAT_FC_BUG-39_model_double_contract` | `…transcribed_in_exactly_one_place` | Two `.workers.test.ts` conversation suites carry their own wire transcription |
| `test_UAT_FC_REQ-127_session_binding` | `…an_unissued_session_id_is_refused_rather_than_opened` | BUG-38 deliberately made that case the accepted one (STORY-103's own Reconciliation Decisions record it); the FC case still asserts the pre-BUG-38 rule |
| `test_UAT_FC_REQ-122_chat_host` | `…primed_with_the_generated_manual_and_bound_to_this_site` | — |

None of the three is an AC-named UAT of this capability. Worth a bug report; not
edited from here.

## Warnings Forwarded (not violations — the loop should run once more)

| # | Element | What remains | Why it was not done this call |
|---|---|---|---|
| 5 | STORY-103 / AC-1057 | No UAT drops the host mid-turn to observe that the tier in front of the archive holds only the turn in flight. The alternative the assessor offers is to narrow the clause to what AC-1406 proves | The observable is in the workerd suites, which cannot start under this sandbox. It is a choice between authoring a test that cannot be run here and narrowing a story-body claim — worth its own pass rather than a guess at the end of this one |
| 6 | AC-1320 | `test_UAT_AC1320_…` still renames the **repository's own** `kb/system/corpus/index` aside and restores it in a `finally`; a killed run leaves it displaced | Pointing the case at a temporary corpus root needs a seam that does not exist: `kbRoot()` is deliberately `repoRoot()/kb` with no override, and `openKnowledge()` in `host.ts` calls `openKnowledgeRuntime()` with no argument. Adding an env override is production code whose only consumer would be a test — a decision worth making explicitly rather than in passing. Flagging it rather than taking it |

## needs_review Items Forwarded

None. `needs_review_count` was 0 and no finding cited an unreviewed decision.
