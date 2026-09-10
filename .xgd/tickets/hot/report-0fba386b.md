---
uid: report-0fba386b
id: REPORT-3703
type: report
title: 'Fix Draft Change Journal: What Changed On The Draft, And Who Changed It (uat)
  — attempt 1'
created_by: xgd
created_at: '2026-09-10T08:53:51.646133+00:00'
updated_at: '2026-09-10T08:53:51.646133+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-702b7c02
  level: uat
  fixes_applied: 10
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Draft Change Journal: What Changed On The Draft, And Who Changed It (uat)

**Attempt**: 1
**Fixes applied this call**: 10
**Violations remaining**: 0
**Needs more work**: false

Both findings are resolved. `npm test -- tests/reconciliation-draft-change-journal.test.ts`
now reports **17 passed (17)** on a tree carrying only the edits below; it reported
16 passed / 1 failed before them, with the failure being AC-1266's UAT throwing on its
first act.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue | `host-core.ts` — the reminder seam | Replaced the `roles` map (held only so the reminder could be rewritten on a role object) with `REMINDER_PROVIDER`, the name a reminder *provider* is registered under |
| 2 | code-issue | `host-core.ts` — role construction | Built the `Role` from `priming` entries (the preamble, then the projected documents) instead of the `system` / `source` keys upstream now ignores |
| 3 | code-issue | `host-core.ts` — role construction | Declared the change signal as a `reminders` entry naming that provider, and registered the callback on the manager's own registry |
| 4 | code-issue | `host-core.ts` — `reminderFor()` | Added: resolves baseline vs. current counter **at turn time**, which is when a reminder provider runs |
| 5 | code-issue | `host-core.ts` — `streamPrompt` | Removed the mutation of the frozen role; the function keeps only the half a turn boundary knows — recording the baseline in `finally` |
| 6 | uat-edit | `tests/support/scripted-model-client.ts` | Added `modelSaw(req)`: what the model was told across every field that carries it. Widened `ModelRequest.system` to string-or-blocks |
| 7 | uat-edit | AC-1266 → `test_UAT_AC1266_…` | Four reads of `client.seen[N].system` moved to `modelSaw` — the reminder rides the turn's tail now, not `system` |
| 8 | uat-edit | `test_UAT_FC_REQ-131_change_journal.test.ts` | Same two reads, same reason — the free-coded UAT for the same behaviour was failing identically |
| 9 | ac-edit | AC-1263 (`acceptance_criterion-8e517739`) | Verification rewritten to the no-op instrument REQ-149 left behind; the Criterion is unchanged |
| 10 | uat-edit (collateral) | `reconciliation-assistant-conversation.test.ts` — AC-1058 | Same `system`-only read, same drift; moved to `modelSaw`. Out of this capability, repaired because the same fix covers it — noted below |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/ai/host-core.ts` | 211–225, 406–455, 480–517, 632–640, 678–681 | Measured, not inferred. **Before**: `TypeError: Cannot add property reminder, object is not extensible` at `host-core.ts:596`, thrown on the first `streamPrompt` call, before any AC-1266 assertion ran. **Upstream**: `Role` calls `Object.freeze(this)` in its constructor and its fields are now `{name, priming, reminders, tools, permissions, sandbox, cacheBoundary}`; `SessionManager.promptStream` calls `assembleReminders(role, turnCtx, {providers})` at the top of every turn, resolving each `reminders` entry through the registry on `manager.providers`. Both the AC and REQ-131 want the signal in front of the model per turn with no call made; the provider seam is the supported way to say that. **After**: 17/17. |

Two things the fix had to cover that the finding did not name, both from the same
upstream drift and both found by doing the work:

**The priming was dead too.** `system` and `source` are not keys `Role` reports on —
they are destructured away and dropped, so a session was priming with **nothing**: no
preamble, no projected manual, no landscape. That failed loudly nowhere, because the
throw at :596 came first. Fixing only the reminder would have delivered a change signal
to a model that had never been told what site it was on or what tools it had. Both now
travel as `priming` entries, preamble first, documents after.

**The reminder no longer rides `system`.** Upstream moved it onto the per-turn *tail* of
the last message (its REQ-144) so no cache breakpoint lands on a block guaranteed to
differ next turn. Every assertion in these suites read `client.seen[N].system`, which is
silent drift in the worst way: half of them assert the signal is *absent*, and reading an
empty field satisfies that for the wrong reason. `modelSaw` reads the whole request, which
is placement-agnostic — the property is that the model was told, not which field carried it.

**Blast radius, measured both ways.** With `host-core.ts` reverted and the test edits in
place, `reconciliation-assistant-conversation.test.ts` + `reconciliation-assistant-conversation-knowledge.test.ts`
report **13 failed / 2 passed** — the assessor was right that no session on this branch
could take a turn. With the fix, the same two files plus the two journal suites report
**4 failed / 41 passed**, and `reconciliation-assistant-conversation.test.ts` alone is
11/11. A six-suite run over everything that opens a session — the two journal suites, the
conversation suite, the chat panel, the session panel and the builder pane — is **60
passed (60)**.

## Still Failing, Outside This Capability

Neither is caused by these edits; both were failing before them, and both belong to other
capabilities' fix loops.

| Test | Failure | Judgement |
|---|---|---|
| `reconciliation-assistant-conversation-knowledge.test.ts` — AC-1317 / AC-1318 / AC-1319 | Grant and declaration mismatches (`KnowledgeSearch: expected undefined to be 'untrusted'`; `['KnowledgeChanges', …]` vs `['KnowledgeChunkSearch', …]`) | A different drift in the knowledge surface, not the priming API. AC-1320 in the same file *was* failing on `Cannot add property reminder` and now passes |
| `test_UAT_FC_BUG-39_model_double_contract.test.ts` | Three files transcribe the wire protocol where one is allowed: the two `*.workers.test.ts` assistant suites carry their own copies | Pre-existing and untouched here — neither file is one this call edited |

## needs_review Items Forwarded

None. Finding 3 was `info` and needed no edit: AC-1621 is `pending` but already carries a
passing, substantive UAT.

## Note for the Assessor

`uat_coverage` is unset on **every** AC under STORY-115, including AC-1266. I left it that
way rather than setting it on the one AC I touched: the field is owned by the UAT-coverage
check, and one AC marked `pass` in a story where sixteen equally-covered siblings are unset
reads as a claim about relative coverage that is not true.
