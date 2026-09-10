---
uid: report-dbe14b4e
id: REPORT-3808
type: report
title: 'Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
  (level=ac)'
created_by: xgd
created_at: '2026-09-10T22:37:06.031986+00:00'
updated_at: '2026-09-10T22:37:06.031986+00:00'
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

Re-derivation at 2026-09-10 of the ac-level ledger last recorded by REPORT-2065
(`report-8ae59922`, 2026-08-16, PASS / 0 violations / 0 warnings / 5 info). This is
not a copy of that report: the AC set was re-read from the tickets today, the story
body was re-read as the working reference, and the post-2026-08-16 intent tree was
re-walked independently. The inputs are provably unchanged (evidence below), so the
verdict is unchanged — which is the determinism the check requires, not an omission
of work.

**Evidence that the ac-level inputs did not move since REPORT-2065:**

- `STORY-104` (`story-7f437d57`) `updated_at` = 2026-08-16T04:42:15Z,
  `last_field_updated` = `uat_coverage` — the only post-report touch was the coverage
  field, not the body.
- All nine ACs (`AC-1062`…`AC-1070`) `updated_at` = 2026-08-16T04:42:02…12Z, same
  field-only sweep; all nine `active`, none deprecated, none added.
- Story-level ran today and passed: REPORT-3807 (`report-d7a7904a`, PASS, 0
  violations, 1 warning), so per the level cascade the story body is a valid working
  reference for this level.

## Cumulative Intent Considered

At `ac` level the story body is the working reference; intent was consulted only to
confirm nothing has been added *below* the story since the last ac check. `CAP-91`
carries no `intent_uid` / `updated_by`; `STORY-104` carries
`intent_uid = bundle-e59210c5` (BUNDLE-17, `free_and_reconciled`, `merged_at_commit`
`0198704b7e29db3c53cf569070042cec0eb467bc`) and no `updated_by`. The nine ACs carry
no `intent_uid` or `updated_by` of their own — they inherit the story's.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-115 | free_and_reconciled | 2026-07-31 | The split, whose secondary held `builder-chat-placeholder` | YES (placeholder retired by REQ-122) |
| REQ-122 | free_and_reconciled | 2026-08-07 | Live `webui-chat` pane: streams turns, renders markdown, tool activity in the collapsible pane; one session per site; pane follows the toolbar with no selector of its own; rehydrate on mount and on every switch; draft keyed per site; missing key / unreachable origin / mid-turn failure explained without losing history | YES — sets the pane's whole behavioural surface |
| REQ-127 | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's pane-held site identity: `createChatPanel` is handed an already-open session — no slug, no `setSite`, no `openSession`, no generation token; the switch and the async guard move to `app.js`; draft key `builder-chat:<slug>` → `builder-chat:<sessionId>`, declared as a one-time migration effect | YES (partial supersession of REQ-122) |
| REQ-119 / REQ-121 / REQ-126 / REQ-128 / REQ-129 / REQ-130 | free_and_reconciled | 2026-08-07…09 | Other BUNDLE-17 members: request-time render, copy modal, L1 control surface and its operations | NO — no pane-observable ask |
| REQ-145, REQ-146 | free_and_reconciled | 2026-08-15 | `control-app` becomes the builder; the AI host moves into workerd. REQ-146 AC2 "reloading the builder resumes the site's conversation" | YES (counts) — adds no *new* pane behaviour; the pane-visible half is already AC-1063's reload clause |
| BUG-38 | free_and_reconciled (BUNDLE-21) | 2026-08-24 | Chat turns fail in workerd. Body re-read today: the ask is deleting the per-isolate `minted` map in `host-core.ts` and resolving the id durably via `SiteStore.hasDraft`. The pane string is the symptom | NO for CAP-91 — host-side, reconciled into STORY-103 (`updated_by: bundle-78f4e2fe`) |
| BUG-39 | bundled | 2026-08-24 | Node chat-host UATs fail: the shared model double speaks the pre-streaming contract | imminent — test infrastructure, no AC-level ask (uat-level relevance only) |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the existing seam | imminent, no pane ask |
| REQ-149…REQ-153, REQ-162, REQ-147, BUG-36, BUG-37 | free_and_reconciled | 2026-08-15…31 | Publish in the cloud, CLI SSR, locale, money/time, reserved slugs, product ticket store, Access, deploy 503, render cache | NO — no pane ask |
| REQ-155–161, REQ-163–166 | draft | 2026-08-20…31 | Capture in workerd, fidelity surface, KB in the Worker, the Library tab, ingestion, corpus export | NO — not yet active. REQ-161 (Library tab) remains the one to watch: the first draft intent that would add a second browser surface beside the pane |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |

**Verified independently this run**: every `request` and `bug` ticket created on or
after 2026-08-14 was listed and triaged (26 requests, 4 bugs). No intent created since
2026-08-08 adds, modifies or retires a pane-observable behaviour. **Current cumulative
intent for CAP-91 = REQ-122 as amended by REQ-127**, exactly as STORY-104's Technical
Context records it.

## Alignment Ledger

Each AC, the story-body bullet it realises, and the intent clause behind it.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1062 — secondary pane is a working conversation surface, no action required | REQ-122 ("hosts `webui-chat` instead of the placeholder") | aligned — realises story bullet 1 ("A live surface"); the "no placeholder text standing in for one" clause is the REQ-115 placeholder's retirement stated as an observable |
| AC-1063 — replay on first open and after reload | REQ-122 ("rehydrated from the stored transcript … survives a browser reload"), REQ-146 AC2 | aligned — realises story bullet 3 ("Replay"); reload clause is broader than the story's wording, see finding 2 |
| AC-1064 — switch swaps and replays; exactly one site control | REQ-122 ("follows the display panel's site and has no selector of its own"), REQ-127 (single-selector shape) | aligned — realises story bullet 2 and the "every switch" half of bullet 3 |
| AC-1065 — send addresses the shown conversation; reply arrives progressively | REQ-122 (streams assistant turns), REQ-127 (`{sessionId, text}` — nothing naming a site) | aligned — realises story bullet 5. "Nothing identifying the previous site carried into it" is REQ-127's shape stated as an outcome |
| AC-1066 — activity shown in the pane's own area alongside the reply | REQ-122 ("shows tool activity in the collapsible tool pane") | aligned — realises the second half of story bullet 1 |
| AC-1067 — unsent draft per conversation, survives a round trip | REQ-122 (draft keyed per site), REQ-127 (key moves to `sessionId`) | aligned — realises story bullet 4; phrased as an outcome, so REQ-127's re-key does not falsify it |
| AC-1068 — an assistant that cannot run is explained, history intact | REQ-122 ("a missing API key … the panel mounts, shows the site's history, and says exactly what is missing") | aligned — realises the first half of story bullet 6 |
| AC-1069 — an unreachable origin is explained in the same place and form | REQ-122 ("an unreachable origin … surfaces in the panel as a message rather than a silent no-op") | aligned — realises the second half of story bullet 6 |
| AC-1070 — switching faster than the answers arrive lands on the last-chosen site | REQ-122 (generation token), REQ-127 (guard relocated to `app.js`) | aligned — realises story bullet 7; stated as an outcome precisely because the mechanism moved, which is why REQ-127 does not falsify it |
| STORY-104 → the AC set as a whole | REQ-122, REQ-127 | **coverage complete**: all seven of the story body's in-scope bullets are realised, and no AC asserts behaviour absent from the story body |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-104 → AC-1062…AC-1070 | — | Each of the story body's seven in-scope bullets maps to at least one AC (live surface → AC-1062 + AC-1066; following the displayed site → AC-1064; replay → AC-1063 + AC-1064; composing state → AC-1067; turns addressed to what is on screen → AC-1065; visible failure → AC-1068 + AC-1069; switching faster than the answers arrive → AC-1070). No behavioural clause in the story body is unaddressed, and no AC addresses behaviour the story body does not describe. | none |
| 2 | info | consistency | AC-1063 | — | The "after it is reloaded" clause is not in the story body's replay bullet, which says "on first open and on every switch". It is directly asked for by REQ-122 ("survives a browser reload") and re-asserted by REQ-146 AC2, and it is written as a pane observable rather than a persistence claim (persistence belongs to STORY-103). Broader than the story wording, not in conflict with it. Unchanged from REPORT-2065 finding 2. | none |
| 3 | info | consistency | AC-1062 + AC-1063 | — | AC-1062 forbids "a line of placeholder text standing in for" the surface while AC-1063 requires an empty conversation to show "an invitation to type". Not a contradiction: AC-1062 bans a label standing in *for* the pane (REQ-115's `builder-chat-placeholder`), AC-1063 requires an affordance *inside* a live one. Unchanged from REPORT-2065 finding 1. | none |
| 4 | info | exclusivity | AC-1065 + AC-1070 | — | Both close by asserting which conversation a subsequent message is addressed to. Not duplicates: AC-1065 covers the ordinary post-switch send, AC-1070 covers the same assertion as the *residue* of a discarded late-arriving conversation. Distinct scenarios, distinct failure modes. Unchanged from REPORT-2065 finding 3. | none |
| 5 | info | exclusivity | AC-1062 + AC-1064 | — | Both state that the conversation shown corresponds to the site the display panel reports. Evaluated fresh this run and not a duplicate: AC-1062 asserts it of the *initial* state with no operator action, AC-1064 asserts it as an *invariant across a switch* and adds the single-selector requirement. Different triggers, different observations. | none |
| 6 | info | exclusivity | AC-1068 + AC-1069 | — | Both describe a failure surfaced in the pane without losing history. Not duplicates: AC-1068 is a conversation that opened but reports it cannot run (missing prerequisite, named specifically), AC-1069 is a conversation that could not be opened at all. AC-1069 explicitly requires the *same place and form* as AC-1068, which makes the relationship deliberate rather than accidental. | none |
| 7 | info | consistency | AC-1064, AC-1065, AC-1067, AC-1070 | — | Every AC that could have named a mechanism is phrased as an observable outcome. None names a slug, a `setSite`, a client-held site identity, or a generation token. This is what keeps the set true under REQ-127's withdrawal of REQ-122's pane-held site identity, and is the property to protect against future edits. Unchanged from REPORT-2065 finding 4. | none |
| 8 | info | coverage | STORY-104 | — | The story's two declared non-criteria are correctly absent from the AC set: (a) the one-time draft-key migration effect (REQ-127 states it explicitly as a migration consequence, not a durable behaviour); (b) rendered markdown. On (b), REPORT-3807 (story level, today) holds an open **warning** with category `ac-add`. That warning is correctly owned at story level and is **not** restated as an ac-level warning here: the ac-level coverage question is whether the ACs cover the story body's behavioural surface, and the story body explicitly declares markdown out of claim ("Known upstream gaps, not claimed here … No criterion asserts rendered markdown"). Double-counting it would drive an ac-level fix loop for a decision the story level deliberately held at warning. | none — track under REPORT-3807 finding 1 |

## Notes for the Editor

**No repair is required at this level.** PASS with zero violations, zero warnings and
zero needs_review.

Three things worth carrying forward:

1. **The one open item in this tree is markdown rendering, and it lives at story
   level.** REQ-122's panel clause names three behaviours — streams turns, renders
   markdown, shows tool activity. Two are criteria (AC-1065, AC-1066); markdown is
   declared-not-claimed in STORY-104's Technical Context. REPORT-3807 holds this as a
   warning with the resolution either an AC asserting markdown rendering (degrading to
   escaped text when the CDN engines do not load) *or* an explicit intent-level
   withdrawal on REQ-122. Resolve it once, at story level; it should not be re-derived
   here on each ac cycle.

2. **AC-1066's evidence altitude is a uat-level question, restated for the third
   time.** The AC requires the activity to be observed *in the pane's activity area*;
   the free-coded REQ-122 evidence took it at the host's SSE stream
   (`test_UAT_FC_REQ-122_chat_host`). The AC is written correctly from the intent, so
   this is not AC drift — but a uat-level check must confirm a pane-side observation
   exists rather than accepting the host-stream test.

3. **The REQ-122 → REQ-127 supersession remains the main drift risk in this tree.**
   The AC set survives it because every criterion that could have named a mechanism is
   phrased as an outcome (finding 7). Any future edit that reintroduces a slug, a
   `setSite`, a client-held site identity or a generation token into an AC body is a
   regression against REQ-127 (`free_and_reconciled`, 2026-08-08), not a
   clarification.

One process note, since this cycle recorded `previous_attempt_count = 1`: no ac-level
fix report exists for CAP-91 under anchor `report-e37a6b4a`, and the last ac-level
check (REPORT-2065) already passed clean. There was no unrepaired ac-level violation
to carry into this attempt — the AC layer has been aligned since 2026-08-16 and
nothing beneath it has moved.
