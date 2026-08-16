---
uid: report-f9356a79
id: REPORT-2067
type: report
title: 'UAT Coverage: Assistant Pane: The Conversation Beside The Page'
created_by: xgd
created_at: '2026-08-16T04:43:24.513386+00:00'
updated_at: '2026-08-16T04:43:24.513386+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-44a04848
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Assistant Pane: The Conversation Beside The Page

**Result**: PASS
**AC verdicts**: 9 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Matrix shape: CAP-91 → STORY-104 (`story_kind=feature`, `intent_uid=bundle-e59210c5`)
→ AC-1062 … AC-1070, all nine `active`, `kind=behavior`, `regression_only=false`.

## Cumulative Intent Considered

The story's `intent_uid` is BUNDLE-17 (`bundle-e59210c5`, `free_and_reconciled`, merged at
`0198704b7e29db3c53cf569070042cec0eb467bc`). Of the eight requests it bundles, only two
touch the pane. No abandoned/deprecated intent bears on this tree; no later intent
(REQ-131 … REQ-148) asks for pane behaviour — REQ-145/REQ-146 (`draft`) would move the
builder and the AI host into workerd, which does not count yet and does not change what
the pane must show.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-122 (`request-58b6a329`) | free_and_reconciled | 2026-08-07 | Originating: replaced `builder-chat-placeholder` with a live panel — message list + composer, streamed turns, tool activity in the pane's tool area, pane follows the toolbar's site with no selector of its own, rehydration on mount and on every switch, per-conversation draft, missing key / unreachable origin explained in the panel without losing history | YES |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | Withdrew the pane's *site identity*: the pane is handed an already-open session (no slug, no `setSite`, no `openSession` of its own, no generation token); `POST /api/ai/prompt` takes `{sessionId, text}`; the async switch guard moved to `app.js`; draft key moved `builder-chat:<slug>` → `builder-chat:<sessionId>` (declared one-time migration effect, deliberately not an AC) | YES — supersedes REQ-122's mechanism, not its outcome |
| REQ-119, REQ-121, REQ-126, REQ-128, REQ-129, REQ-130 | free_and_reconciled (BUNDLE-17) | 2026-08-07 → 2026-08-10 | Request-time render, copy-edit modal, L1 control-surface API, background-image picker, verbatim L1 authoring, structured config | YES, but none asks for pane behaviour |
| REQ-131, REQ-133, REQ-139, REQ-140 | ready_to_reconcile | 2026-08-11 → 2026-08-15 | Draft change journal, palette popup, locked controls, editor colour | imminent, none touches the pane |

Walked chronologically, the cumulative intent for this capability is exactly REQ-122's
observable outcomes as re-mechanised by REQ-127. The story body states that supersession
explicitly and writes its criteria from REQ-127 — including AC-1070 as an *outcome*
("the pane ends up on the site last chosen") rather than as a mechanism, which is correct
because the guard moved from `chat.js` to `app.js` while the observable stayed identical.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-104 | REQ-122, REQ-127 (via BUNDLE-17) | aligned | Every in-scope clause of the body maps to a live intent and to an AC: live surface → AC-1062/AC-1066; following the displayed site with one selector → AC-1064; replay → AC-1063; per-conversation draft → AC-1067; turns addressed to what is on screen, progressive reply → AC-1065; visible failure (cannot run / unreachable origin) → AC-1068/AC-1069; switching faster than the answers arrive → AC-1070. Nothing in the body claims REQ-127's withdrawn slug mechanism as current — it is recorded as history under Technical Context, which is where it belongs. The one declared non-criterion (the draft-key migration) is correctly excluded rather than silently dropped. |

## Evidence Read

All nine UATs live in `tests/reconciliation-builder-assistant-pane.test.ts`, driven from
the real workspace entry point `mountBuilder` (`apps/control-app/src/builder/app.js`)
against the really-installed `@lagrangefoundry/webui-chat`. Only the HTTP transport is
injected, through `chatTransport` — a production seam that defaults to the real
`openChatSession` (`app.js:103-106`); jsdom cannot serve HTTP and the origin half is
proven separately (`test_UAT_FC_REQ-122_chat_host`, `test_UAT_FC_REQ-127_session_binding`).
That is a thin mock at an external boundary: no internal component is stood in for, and
the production wiring under test — the site→session translation and the generation guard
at `app.js:178-202` — is real code, not a test double.

| AC | UAT | Verdict | Why it is substantive |
|---|---|---|---|
| AC-1062 | `test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site` (L154) | pass | Asserts a real `.chat-widget` / `.chat-widget-messages` / `.chat-widget-input-bar` in the split's secondary, and that the composer *works* — send control inert with nothing typed, live once typed into. Binding is checked at both ends: `panel.getSite()==='alpha'`, `openSession` asked exactly `['alpha']`, `data-chat-id` = `${CHAT_ID_PREFIX}site-alpha`, `getSessionId()==='site-alpha'`, all before any operator action. A placeholder or a decorative composer fails it. |
| AC-1063 | `…AC1063_the_pane_replays_what_the_conversation_holds_on_open_and_after_reload` (L192) | pass | `getMessages()` compared to the conversation's turns with order and speaker preserved; destroy + fresh `mountBuilder` against the same persisted storage covers the reload clause; the zero-turn site shows a visible `.chat-widget-empty-state` carrying `chat.js`'s own `EMPTY_TEXT` — not the other site's turns, not a blank pane. Transcript durability itself is the host's (CAP-90) and is proven there. |
| AC-1064 | `…AC1064_changing_site_changes_the_conversation_and_only_the_toolbar_chooses` (L235) | pass | Switch swaps turns and `data-chat-id` while `panel.getSite()` moves in the same action; the return trip is unmixed in both directions. The single-selection-point clause is asserted at *workspace* scope (`root.querySelectorAll('select').length===1`, that one being `builder-toolbar__site` inside `toolbar.element`) plus the pane's absent `setSite`/`getSite` surface — a split-scoped assertion would have passed with a second selector sitting beside it. |
| AC-1065 | `…AC1065_a_message_addresses_the_shown_conversation_and_the_reply_streams_in` (L295) | pass | After a switch, `streamPrompt` receives exactly `['site-beta', text]` — a slug or alpha's session appearing there would mean the previous site leaked into the turn. Progressiveness is proven by a snapshot taken *inside* the generator while the turn is still open, then the completed list shows exactly one assistant message. A lump-at-the-end implementation fails the mid-turn assertion. |
| AC-1066 | `…AC1066_what_the_assistant_did_is_shown_in_the_panes_activity_area` (L348) | pass | Observed **in the pane** — `.chat-tool-pane-body` → `.chat-tool-event-name` equals `['set_l1']` — not merely in the host's stream, which is what the story's evidence note asked the pane criterion to demonstrate. Distinctness is asserted (the reply still arrives; no message text contains `set_l1`), and the quiet turn leaves zero `.chat-tool-event` nodes while still producing a reply. |
| AC-1067 | `…AC1067_an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip` (L425) | pass | Distinctive text typed into alpha and never sent; beta's composer is empty; the return trip restores exactly that text with the message list still empty, proving nothing was sent en route. Session identity is re-checked at each leg (`getSessionId()`), so a draft that survived by being global rather than per-conversation would still fail the beta-is-empty assertion. |
| AC-1068 | `…AC1068_an_assistant_that_cannot_run_is_explained_with_the_history_intact` (L457) | pass | `ready:false` with a stated reason: the pane still mounts, the earlier turns are intact and in order at the head of the list, and exactly one appended assistant note names the specific missing prerequisite (`ANTHROPIC_API_KEY`) rather than a generic failure. The length assertion forbids clearing or duplicating the history. |
| AC-1069 | `…AC1069_an_unreachable_origin_is_reported_in_the_pane_not_left_blank` (L492) | pass | `openSession` throws; the surface (messages + composer) is still present, one assistant note carries both "could not be reached" and the underlying `Failed to fetch`, and the "no endless wait" clause is asserted structurally — no lingering `.chat-widget.is-streaming`, empty state stood down. This exercises the real catch branch at `app.js:189-201`. |
| AC-1070 | `…AC1070_switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site` (L531) | pass | Alpha's open is genuinely held in flight (no settle before the switch) and released *after* beta resolves, so a workspace that adopted whichever answer arrived last would end on alpha. Asserts the outcome three ways: session/panel on beta, none of alpha's distinctive turns present, and a subsequent send addressed to `site-beta`. Exercises the real generation guard rather than asserting its existence. |

None of the nine is trivial, structural (source-text/name matching), or mocks the thing
it measures.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1062 … AC-1070 (whole suite) | none required (informational) | All nine UATs sit under `describe.skipIf(!WEBUI_INSTALLED)`. The webui components are an *implicit* out-of-repo dependency (`bin/install` in `lagrange-framework`), so on a fresh clone the entire evidence set for this capability disappears into skips while the run stays green. Verified installed for this run — all five `WEBUI_PACKAGES` resolve under `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/` from the main checkout — so the evidence is live here. | No matrix edit. The skip is deliberate and documented in `tests/support/webui-installed.ts` (a reported gap beats a silently green run), and AC-961 in `tests/reconciliation-builder-workspace-origin.test.ts` asserts the value rather than branching on it. The durable fix is upstream (a private registry), not in this capability. |

Zero violations, zero needs_review.

## Notes for the Editor

Nothing to edit. Recorded for the next round rather than as work:

- **The REQ-122 → REQ-127 supersession is handled correctly and should stay that way.**
  The story keeps the withdrawn slug mechanism in Technical Context as history and writes
  AC-1070 as an outcome, which is why the criterion survived the mechanism moving from
  `chat.js` to `app.js`. If a future intent moves the guard again (REQ-146 takes the AI
  host into workerd), AC-1070 needs no edit — that is the criterion working as designed.
- **AC-1066's pane-side observation is now discharged.** REPORT-2065 carried forward a
  note that existing free-coded evidence proved tool activity at the host's stream rather
  than in the pane; `test_UAT_AC1066_*` observes `.chat-tool-pane-body` directly, so the
  note can be closed rather than re-raised.
- **Assessment limitation, stated plainly.** This session's sandbox refused every test
  invocation (`npx vitest`, `npm test`), so the verdicts above come from reading the nine
  UATs and from independently confirming that the components they mount are installed —
  not from a run made here. Execution validity for this same suite was assessed by the
  immediately preceding `check_uat_validation` cycle (REPORT-2066, pass, 0 violations).
