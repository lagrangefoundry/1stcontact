---
uid: report-8ae59922
id: REPORT-2065
type: report
title: 'Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
  (level=ac)'
created_by: xgd
created_at: '2026-08-16T04:32:23.054950+00:00'
updated_at: '2026-08-16T04:32:23.054950+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-44a04848
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability (CAP-91, created 2026-08-10) holds exactly one story, STORY-104
(`story-7f437d57`, `story_kind=feature`, status=completed), whose `intent_uid` is
BUNDLE-17 (`bundle-e59210c5`). No element in the tree carries an `updated_by` chain,
so the ledger is the bundle and the two of its member requests that touch the pane.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled (result=pass, merged at `0198704b`) | 2026-08-10 | Bundles REQ-119, REQ-122, REQ-121, REQ-126, REQ-128, REQ-127, REQ-129, REQ-130. Only REQ-122 and REQ-127 touch the assistant pane. | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | 2026-08-07 | Originating intent: replaced `builder-chat-placeholder` with a live chat panel — message list + composer, streamed turns, tool activity in the pane's tool area, pane follows the toolbar's site with no selector of its own, rehydration from the stored transcript on mount and on every switch, per-site draft key `builder-chat:<slug>`, missing API key / unreachable origin explained in the panel without losing history. | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's site identity in the pane: `createChatPanel` is handed an already-open session and knows nothing else (no `setSite`, no slug, no `openSession`, no generation token); `POST /api/ai/prompt` takes `{sessionId, text}`; `POST /api/ai/session {slug}` stays the only place a site becomes a session; the async switch guard moves to `app.js`. Declared one-time consequence: draft key moves `builder-chat:<slug>` → `builder-chat:<sessionId>`. | YES (supersedes REQ-122's mechanism) |
| REQ-119, REQ-121, REQ-126, REQ-128, REQ-129, REQ-130 | free_and_reconciled (in BUNDLE-17) | 2026-08-07 → 2026-08-10 | Request-time render, copy-edit modal, L1 control-surface API, background image picker, L1 authoring, structured config. None asks for pane behaviour. | YES, but not applicable to this capability |

No abandoned / deprecated / draft intent touches this tree; nothing in the ledger is
merely imminent.

## Alignment Ledger

Level is `ac`, so STORY-104's body is the working reference; intent was consulted only
where the story body itself defers to it (the REQ-122 → REQ-127 supersession note, the
declared non-criteria, and the reload case).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1062 — secondary pane is a working conversation surface, unprompted | REQ-122 | aligned — story in-scope "A live surface"; "no line of placeholder text standing in for one" tracks REQ-122's replacement of `builder-chat-placeholder` |
| AC-1063 — replays the site's existing turns on first open and after reload | REQ-122 | aligned — story in-scope "Replay"; the reload clause is not in the story body verbatim but is REQ-122's explicit ask ("persisted and survives a browser reload"), and is asserted as a pane observable, not as storage (which the story sends to CAP-90) |
| AC-1064 — changing site changes the conversation with it; exactly one site control | REQ-122, REQ-127 | aligned — story in-scope "Following the displayed site" plus the on-switch half of "Replay"; stated as outcome, naming no mechanism REQ-127 withdrew |
| AC-1065 — send addresses the shown conversation; reply arrives progressively | REQ-122, REQ-127 | aligned — story in-scope "Turns addressed to what is on screen"; "carries only that conversation and the typed text" matches REQ-127's `{sessionId, text}` and correctly asserts no slug |
| AC-1066 — turn activity shown in the pane alongside the reply | REQ-122 | aligned — story in-scope "A live surface" (what the assistant did visible alongside what it said); story's Evidence note flags that today's free-coded evidence observes activity at the host's stream, which is a UAT-level concern, not an AC-level one |
| AC-1067 — unsent draft belongs to one conversation and survives a round trip | REQ-122, REQ-127 | aligned — story in-scope "Composing state per conversation"; phrased per *conversation*, not per site, which is REQ-127's key move; the one-time migration effect is correctly absent as a criterion per the story's declaration |
| AC-1068 — an assistant that cannot run is explained, history intact | REQ-122 | aligned — story in-scope "Visible failure", first half; "read before the backend is touched" (REQ-122) is why history survives |
| AC-1069 — an unreachable origin is reported, no blank pane and no endless wait | REQ-122 | aligned — story in-scope "Visible failure", second half |
| AC-1070 — switching faster than answers arrive leaves the pane on the last-chosen site | REQ-127 | aligned — story in-scope "Switching faster than the answers arrive"; stated as an outcome, deliberately naming neither REQ-122's generation token nor REQ-127's `app.js` guard, exactly as the story's supersession note requires |

Coverage roll-up: every one of the story's seven in-scope bullets has at least one AC,
and every AC traces to an in-scope bullet. Nothing the story declares out of scope
(routes/session lifecycle/persistence → CAP-90; granted operations → site control
surface; divider/rail/resize → CAP-85) is asserted by any AC. Both items the story
explicitly declares as *non*-criteria — the one-time draft-key migration, and rendered
markdown — are correctly absent from the AC set.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-1063 | — | AC adds an empty-state clause ("an empty conversation with an invitation to type") that the story body does not state in those words. It is a specification of the story's "shows what that site's conversation already contains" for the zero-turn case, and does not conflict with AC-1062's ban on placeholder text — AC-1062 forbids a label standing in *for* the surface, AC-1063 requires an affordance *inside* a live one. | none |
| 2 | info | consistency | AC-1063 | — | The "after it is reloaded" clause is not in the story body's replay bullet ("on first open and on every switch") but is directly asked for by REQ-122 and is written as a pane observable rather than a persistence claim. Aligned to intent. | none |
| 3 | info | exclusivity | AC-1065 + AC-1070 | — | Both close with a statement about which conversation a subsequent message is addressed to. Not duplicates: AC-1065 covers the ordinary post-switch send, AC-1070 covers the same assertion as the *residue* of a discarded late-arriving conversation. Distinct scenarios, distinct failure modes. | none |
| 4 | info | consistency | AC-1067, AC-1070 | — | Both are stated as observable outcomes rather than mechanisms, which is what keeps them true under REQ-127's withdrawal of REQ-122's per-slug draft key and generation token. No AC in the set names a slug, a `setSite`, a generation token, or a client-held site identity. | none |
| 5 | info | coverage | STORY-104 | — | The story's two declared non-criteria (the one-time draft-key migration effect; rendered markdown, a known upstream degradation) are correctly not expressed as ACs. Their absence is intentional, not a coverage gap. | none |

## Notes for the Editor

No repair is required at this level.

The one thing worth carrying forward to the **uat** level is the story's own Evidence
note, restated at AC-1066: the existing free-coded evidence for tool activity was taken
at the host's SSE stream (`test_UAT_FC_REQ-122_chat_host`), while AC-1066 as written
requires the activity to be observed *in the pane's activity area*. The AC is correctly
written from the intent, so this is not AC drift — but a UAT-level check should confirm
the pane-side observation exists rather than accepting the host-stream test as evidence
for AC-1066.

Second, the REQ-122 → REQ-127 supersession is the main drift risk in this tree, and the
AC set currently survives it because every criterion that could have named a mechanism
(AC-1064, AC-1065, AC-1067, AC-1070) is phrased as an outcome. Any future edit that
reintroduces a slug, a `setSite`, or a generation token into an AC body would be a
regression against REQ-127 (free_and_reconciled, 2026-08-08), not a clarification.
