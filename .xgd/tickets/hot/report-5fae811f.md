---
uid: report-5fae811f
id: REPORT-2066
type: report
title: 'Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
  (level=uat)'
created_by: xgd
created_at: '2026-08-16T04:37:54.001132+00:00'
updated_at: '2026-08-16T04:37:54.001132+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-44a04848
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Level is `uat`, so the AC bodies are the working reference. The story- and ac-level
cycles for this same anchor report already ran and both passed (REPORT-2064 story=pass,
REPORT-2065 ac=pass, 0 violations each), so the upper layers are taken as correct and
intent was consulted only where an AC or a test defers to it (the REQ-122 → REQ-127
supersession, and REPORT-2065's carried-forward note on AC-1066).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled, merged at `0198704b` | 2026-08-10 | The story's `intent_uid`. Bundles REQ-119/121/122/126/127/128/129/130; only REQ-122 and REQ-127 touch the pane. | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | 2026-08-07 | Originating: live chat panel replacing `builder-chat-placeholder` — message list + composer, streamed turns, tool activity in the pane's tool area, pane follows the toolbar's site with no selector of its own, rehydration on mount and on every switch, per-conversation draft, missing key / unreachable origin explained in the panel without losing history. | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | Withdrew the pane's site identity: the pane is handed an already-open session (no slug, no `setSite`, no `openSession`, no generation token); `streamPrompt` takes a session id; the switch guard moved to `app.js`; draft key moved slug → sessionId (declared one-time effect, deliberately not an AC). | YES (supersedes REQ-122's mechanism) |
| REQ-119, REQ-121, REQ-126, REQ-128, REQ-129, REQ-130 | free_and_reconciled (in BUNDLE-17) | 2026-08-07 → 2026-08-10 | Request-time render, copy-edit modal, control-surface API, background image picker, L1 authoring, structured config. None asks for pane behaviour. | YES, not applicable here |

No abandoned / deprecated / draft intent touches this tree; nothing is merely imminent.

## Alignment Ledger

Matrix shape: CAP-91 → STORY-104 (`story_kind=feature`) → AC-1062 … AC-1070, all nine
`active`, `kind=behavior`, `regression_only=false`. Every UAT lives in
`tests/reconciliation-builder-assistant-pane.test.ts`, mounted against the real
`mountBuilder` (`apps/control-app/src/builder/app.js`) and the really-installed
`@lagrangefoundry/webui-chat`, with only the HTTP transport injected — an external
boundary, so the thin-mock rule holds and no internal component is stood in for.

| Element | Test (all in `tests/reconciliation-builder-assistant-pane.test.ts`) | Outcome |
|---|---|---|
| AC-1062 | `test_UAT_AC1062_…working_conversation_for_the_displayed_site` (L154) | aligned — asserts a real `.chat-widget` + `.chat-widget-messages` + `.chat-widget-input-bar` in the split's secondary, the send control inert-then-live once typed into (a working composer, not a decorative one), `panel.getSite()==='alpha'` with `openSession` asked exactly `['alpha']`, and the session already bound (`data-chat-id`, `getSessionId()`) with no operator action |
| AC-1063 | `…AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload` (L192) | aligned — `getMessages()` equals the conversation's turns with order and role preserved; a destroy-and-remount against the same persisted storage replays them again (the reload clause); the zero-turn site shows a visible `.chat-widget-empty-state` carrying `chat.js`'s own `EMPTY_TEXT`, not the other site's turns and not a blank pane |
| AC-1064 | `…AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses` (L235) | aligned — switch swaps the pane's turns and `data-chat-id` while `panel.getSite()` moves with it, return trip is unmixed in both directions, and the single-selection-point clause is asserted at workspace scope (`root.querySelectorAll('select').length===1`, that one being `builder-toolbar__site`) plus the pane's absent `setSite`/`getSite` surface |
| AC-1065 | `…AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in` (L295) | aligned — after a switch, `streamPrompt` receives exactly `['site-beta', text]` (no slug, nothing of the previous site); a mid-generator snapshot proves the reply is visible before the turn completes; the turn ends as exactly one assistant message |
| AC-1066 | `…AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area` (L348) | aligned — the acting turn is observed **in the pane** (`.chat-tool-pane-body` → `.chat-tool-event-name` = `['set_l1']`), distinct from the reply, with no leak into message text; the quiet turn leaves the area with zero `.chat-tool-event` nodes while the reply still arrives. This is precisely the pane-side observation REPORT-2065 asked the uat level to confirm rather than accepting the host-stream test as evidence |
| AC-1067 | `…AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip` (L425) | aligned — draft typed into alpha, beta's composer empty, return restores the exact text unsent with the message list still empty (nothing was sent en route) |
| AC-1068 | `…AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact` (L457) | aligned — `ready:false` with a stated reason; the pane still mounts, the earlier turns are intact and in order at the head of the list, and exactly one appended assistant note names the specific missing prerequisite (`ANTHROPIC_API_KEY`), not a generic failure |
| AC-1069 | `…AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank` (L492) | aligned — `openSession` throws; the surface (messages + composer) is still present, one assistant note carries both "could not be reached" and the underlying `Failed to fetch`, and neither a persistent `is-streaming` state nor a lingering empty state remains |
| AC-1070 | `…AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site` (L531) | aligned — alpha's open is held past beta's and released late; the pane ends on `site-beta` with `panel.getSite()==='beta'`, none of alpha's distinguishable turns present, and a subsequent send addressed to `site-beta`. Stated as an outcome, so it survives REQ-127 moving the guard from the pane to the app |

Coverage: 9/9 active ACs have a substantive UAT. Exclusivity: nine distinct tests, one
per AC, no two exercising the same scenario in the same shape. Consistency: each test
exercises the behaviour its AC describes, and no test names a slug, a `setSite`, or a
generation token at the pane boundary — the REQ-127-facing drift risk REPORT-2065
flagged is not present in the tests either.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-1066 | — | REPORT-2065's carried-forward note is discharged: the AC-1066 UAT observes tool activity in the pane's own area (`.chat-tool-pane-body`), not at the host's SSE stream. The free-coded host-stream test is not being leaned on as evidence for this AC. | none |
| 2 | info | consistency | AC-1064 | — | The UAT drives the switch through `panel.setSite`, not by dispatching `change` on the toolbar `<select>`. That last link (select → `panel.getSite()` → the frame's src) is CAP-85's AC-967, asserted in `tests/reconciliation-builder-workspace-mounted.test.ts:334-346`, which is where the story's out-of-scope note puts it. Composed, the chain is covered; neither suite duplicates the other. | none |
| 3 | info | consistency | AC-1062 | — | The "no line of placeholder text standing in for one" clause has no dedicated negative assertion, but `chat-placeholder` no longer occurs anywhere under `apps/` or `tests/` (REQ-122 removed it), and the UAT proves a real mounted widget in its place. Adequate as written. | none |
| 4 | info | exclusivity | AC-1062 … AC-1070 vs `test_UAT_FC_REQ-122_chat_panel` / `test_UAT_FC_REQ-127_session_panel` | — | Free-coded suites cover neighbouring ground (the pane's session-only surface, a slow open for an abandoned site). They are pre-existing FC evidence at the component boundary, not matrix UATs, and the AC UATs drive from the workspace entry point instead — different boundary, not a redundant duplicate. | none |
| 5 | info | coverage | whole suite | — | All three describes are `describe.skipIf(!WEBUI_INSTALLED)`. The gate is the documented, accepted pattern (`tests/support/webui-installed.ts`, asserted rather than branched on by AC-961) for the implicit shared-artifact-store dependency. The store is present in this environment (`@lagrangefoundry/webui-chat` resolves), and `vitest.config.mts` includes `tests/**/*.test.ts` and aliases the real packages, so the suite is live here rather than silently skipping. | none |

## Notes for the Editor

No repair is required at this level. Nothing to fix, nothing escalated.

Two things worth carrying forward:

1. **The evidence is environment-gated, and that gate is the one thing that could turn
   this PASS hollow.** All nine UATs skip wholesale on a machine without the shared
   `webui-*` store. That is deliberate and visible in the test report, and the store
   resolves in this environment — but any future run of this check should confirm the
   suite actually executed rather than reading the file and assuming it did.

2. **REQ-127 supersession holds at the test layer too.** Every UAT asks "which site" at
   the app boundary (`openSession` receives slugs) and "which conversation" at the pane's
   (`streamPrompt` receives session ids), and the `fakeTransport.asked` record is what
   makes a regression that reintroduced a site identity below the app observable from
   outside. A future edit that let a slug reach `streamPrompt`, or that asserted a
   generation token, would be a regression against REQ-127 (free_and_reconciled,
   2026-08-08) and should be treated as such rather than as a test-detail change.

Verification note: this check is read-only and the session's permission mode blocks
running `vitest`, so the tests were assessed by reading them against the ACs and against
the real implementation seams they bind to (`chat.js`'s `CHAT_ID_PREFIX`, the installed
`webui-chat` package, `vitest.config.mts`'s include/alias) — not by executing the suite.
Execution evidence for this branch comes from the regression run itself.
