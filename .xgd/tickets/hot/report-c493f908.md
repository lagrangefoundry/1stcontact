---
uid: report-c493f908
id: REPORT-3805
type: report
title: 'Fix UAT Coverage: AI Site Assistant: Per-Site Conversations — attempt 4 (warnings
  closed)'
created_by: xgd
created_at: '2026-09-10T22:14:51.622668+00:00'
updated_at: '2026-09-10T22:14:51.622668+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-7e4714b7
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix UAT Coverage: AI Site Assistant: Per-Site Conversations

**Attempt**: 4 (second call — the three violations were closed on the first;
this call closes the two warnings it forwarded)
**Fixes applied**: 5
**Violations remaining**: 0
**Warnings remaining**: 0
**Needs more work**: false

## The sandbox finding that changed what was possible

The check reported that three of the five suites "could not be executed here at
all" (`EPERM: listen 0.0.0.0`), and 20 of its 23 AC verdicts were therefore
reading-based rather than executed. **That is no longer true in this
environment.** All five suites run:

| Suite | Result |
|---|---|
| `reconciliation-assistant-conversation` | 13/13 |
| `reconciliation-assistant-conversation-knowledge` | 4/4 |
| `reconciliation-assistant-conversation-artifact` | 3/3 |
| `reconciliation-assistant-conversation-continuity.workers` | 4/4 |
| `reconciliation-assistant-conversation-deployed.workers` | 4/4 |
| **total** | **28/28** |

So the capability's evidence is now executed rather than read. The previous
call's repairs to the three knowledge violations hold under that execution.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | test-infra | `support/scripted-model-client.ts` | Added `stalls(text)`: a step that streams the assistant's text and then holds the turn open until released. `ModelStep` now also accepts an async iterable; the plain-array path is the identical loop. The transcription stays in the one file BUG-39 requires — `stalls` emits the same three events `says` does |
| 2 | uat-add | AC-1057 | Authored `test_UAT_AC1057_losing_the_host_mid_turn_costs_that_turn_and_not_the_conversation`. Resolves finding 5 by the assessor's FIRST option (add the case) rather than the second (narrow the clause) |
| 3 | ac-edit | AC-1057 | Verification extended to ask for the junction's bound as its own observation, since a restart taken between completed turns cannot reach it. Criterion unchanged — it was never wrong, only unobserved |
| 4 | code-issue | AC-1320 | Added `setKnowledgeRoot` to `host.ts`, declared as a test seam beside `setModelClient`, and cleared by `resetAiHost` |
| 5 | uat-edit | AC-1320 | Rewrote the case onto throwaway roots. It no longer renames the repository's own `kb/system/index` aside; **nothing of the checkout is touched**. Resolves finding 6 |

## How finding 5 was actually proved

The assessor's option (a) needed something that did not exist: a mid-turn instant
to stand in. I probed for one first rather than assuming, and the probe was
decisive — against the instantaneous double, aborting the client mid-stream
**did not** lose the turn. The whole of turn B was answered, drained and present
in the archive before the client could read its first chunk. A test written on
the assumption would have asserted nothing.

Two facts made the case possible:

- **The Node host's junction is `memoryJunctions()`.** `SessionManager` accepts
  `junctions` and nothing else; `host-core.ts` passes `{ logDir }` when no
  junction is supplied, which is an ignored extra key, so Node takes the
  library's default — an in-memory tier, exactly what the criterion describes.
- **`stalls` supplies the missing instant.** With the stream held open after the
  assistant's text, "while a turn is in flight" becomes a state the suite can
  stand in and read the archive from.

The case then asserts both halves of the clause: mid-flight, the session's own
transcript holds the completed exchange and **not** the answer being spoken; after
`resetAiHost()` from inside that turn, the completed exchange replays intact and
well-formed and the in-flight answer is gone.

**Verified adversarially, twice.** Removing the stall (making the gate resolve
immediately) fails the case exactly where it should —
`expected 'The first thing\nNoted — the first th…' not to contain 'This answer is
still being spoken.'` — then restored. The archive read was also deliberately
narrowed from "everything under the transcript directory" to the session's own
transcript file: the tier in front is precisely the thing allowed to be holding
that text, so the wider read would have asserted the opposite of the criterion.

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/ai/host.ts` | `knowledgeRoot`, `setKnowledgeRoot`, `openKnowledge`, `resetAiHost` | Finding 6 prescribes "point the case at a temporary corpus root". No such affordance existed: `kbRoot()` is `repoRoot()/kb` with no override, and `openKnowledge()` called `openKnowledgeRuntime()` with no argument — which is why the case was renaming the checkout's own index aside and restoring it in a `finally`, a working directory a killed run leaves damaged. Added as a declared TEST SEAM, the second this module has, beside `setModelClient` which documents itself the same way. Nothing in production calls it; the repository's KB is still what is read. Proven live: the case's "built but unopenable" leg asserts on a `console.error` that can only be reached if the seam actually redirected the lookup |

## A finding for the next iteration (not acted on here)

**`HostDeps.logDir` is dead configuration.** `host-core.ts` passes
`{ junctions } : { logDir }` to `SessionManager`, but the constructor's options
are `{ junctions, product, providers, … }` — `logDir` is not among them, and
`this.junctions = junctions || memoryJunctions()`. So the Node host's carefully
placed file junction is never built, `storage/chat/live/` is never written, and
the long comment at `host-core.ts` explaining why "both tiers sit under
{@link sessionsDir}" describes something that does not happen.

This does not break AC-1057 — an in-memory junction is what the criterion
describes, and the new case proves the behaviour through the real host either
way. But it is dead configuration explained by a comment that is wrong, and
whether the Node host *wants* a file junction is a design decision, not a repair
to make in passing. Flagging rather than taking it.

## Pre-existing failures, unchanged

Re-checked after the edits; identical to the baseline established by stashing
every change last call. `BUG-39`'s one-place case still names the same two
workers suites and no third — `stalls` went into the canonical file, so it added
nothing to that list.

| Suite | Case |
|---|---|
| `test_UAT_FC_BUG-39_model_double_contract` | `…transcribed_in_exactly_one_place` |
| `test_UAT_FC_REQ-127_session_binding` | `…an_unissued_session_id_is_refused_rather_than_opened` |
| `test_UAT_FC_REQ-122_chat_host` | `…primed_with_the_generated_manual_and_bound_to_this_site` |

None is an AC-named UAT of this capability. `REQ-127`'s is the one BUG-38
deliberately inverted, recorded in STORY-103's own Reconciliation Decisions.

## needs_review Items Forwarded

None.
