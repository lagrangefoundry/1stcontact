---
uid: report-10937fa3
id: REPORT-2064
type: report
title: 'Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
  (level=story)'
created_by: xgd
created_at: '2026-08-16T04:27:31.337394+00:00'
updated_at: '2026-08-16T04:27:31.337394+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-44a04848
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability (CAP-91) and its sole story carry `intent_uid = bundle-e59210c5`
(BUNDLE-17, `free_and_reconciled`, `merged_at_commit`
`0198704b7e29db3c53cf569070042cec0eb467bc`). Neither the capability nor STORY-104
carries an `updated_by` chain, so the ledger was built by walking the bundle's
eight member requests plus every request created after it, and keeping those with
a browser-observable ask about the assistant pane.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell: the split, whose secondary held `builder-chat-placeholder` | YES (placeholder later retired) |
| REQ-122 | free_and_reconciled | 2026-08-07 | Replaced the placeholder with a live `webui-chat` pane: streams turns, renders markdown, shows tool activity; one session per site, pane follows the toolbar with no selector of its own; rehydrate on mount and on every switch; draft keyed per site; missing key / unreachable origin explained without losing history | YES |
| REQ-127 | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's pane-held site identity: `createChatPanel` is handed an already-open session — no slug, no `setSite`, no `openSession`, no generation token; the switch and its async guard move to `app.js`; draft key moves `builder-chat:<slug>` → `builder-chat:<sessionId>` (declared one-time consequence) | YES (partial supersession of REQ-122) |
| REQ-123 | free_coded | 2026-08-07 | System KB — priming corpus for the session. Explicitly "REQ-122 renders the chat UI; this ticket gives that session something to know." No pane-observable ask | NO (host/priming, not this capability) |
| REQ-126 / REQ-129 / REQ-130 | free_and_reconciled | 2026-08-08/09 | L1 control surface, tool declaration, config/module/metadata operations — what the assistant can reach | NO (site control surface capability) |
| REQ-131 | ready_to_reconcile | 2026-08-11 | Draft change journal. "Explicitly out of scope: surfacing the journal to the client in the builder UI" | imminent, but no pane ask |
| REQ-146 | draft | 2026-08-15 | AI host and publish move into workerd | NO (draft) |

Walked chronologically: REQ-115 put a placeholder in the secondary; REQ-122
replaced it with a live pane and set the pane's whole behavioural surface;
REQ-127 relocated the site binding out of the pane, leaving the externally
observable result identical. Current cumulative intent = REQ-122 as amended by
REQ-127.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-91 (body) | REQ-122, REQ-127 | aligned — scope bullets (live surface / follows the displayed site / replay / per-conversation composing state / visible failure) each trace to a REQ-122 clause; the "no second control that could disagree" phrasing follows REQ-127's single-selector shape |
| STORY-104 | REQ-122, REQ-127 | aligned, with one coverage warning (finding 1). No text in the body is unsupported by the ledger; the retired placeholder (REQ-115) correctly does not appear anywhere in the tree |
| STORY-104 → AC-1062…AC-1070 (9 active) | REQ-122, REQ-127 | present and consistent with the story body; markdown rendering is the one REQ-122 clause with no AC |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-104 | ac-add | REQ-122 (`free_and_reconciled`, 2026-08-07) states the panel "streams assistant turns, **renders markdown**, and shows tool activity in the collapsible tool pane". Two of the three are criteria (AC-1065 streaming, AC-1066 tool activity); markdown rendering is expressed nowhere in the story tree as behaviour — it appears only in STORY-104's Technical Context as "Known upstream gaps, not claimed here … No criterion asserts rendered markdown". No intent in the ledger retired it, and the behaviour is in fact wired: `loadMarked()` / `loadSanitizer()` at `apps/control-app/src/builder/chat.js:57-58`, with `webui-markdown` in `WEBUI_PACKAGES` (`tools/generate/src/cli/webui.ts:120`). The stated rationale is evidence difficulty (CDN-loaded engines behind the component's own seams, degrading to escaped text), which is not an intent withdrawal | Add an AC under STORY-104 asserting the pane renders assistant markdown (degrading to escaped text when the engines do not load), or record an explicit intent-level withdrawal of the clause. Held at warning rather than violation because the omission is declared in the matrix with an accurate rationale, and REQ-122's own panel evidence list does not name markdown either |
| 2 | info | consistency | STORY-104 | — | Story body asserts CAP-85/story-e674c60a's placeholder criterion "is superseded and re-pointed to the live pane". Verified: AC-973's body now reads "it held when the secondary pane was a placeholder and it holds now that the pane hosts a live assistant". The cross-capability claim is true; no stale placeholder text survives in either tree | none |
| 3 | info | consistency | STORY-104 | — | REQ-122's `POST /api/ai/prompt {slug, text}` and the browser-held `generation` token were withdrawn by REQ-127. STORY-104 records the supersession and states the race criterion (AC-1070) as an outcome ("the pane ends up showing the site they last chose") rather than as a mechanism, which is correct — the guard now lives in `app.js`, not the pane | none |
| 4 | info | coverage | STORY-104 | — | REQ-127's draft-key migration (`builder-chat:<slug>` → `builder-chat:<sessionId>`, so a pre-upgrade draft is not found after) is deliberately not written as a criterion. Correct: REQ-127 frames it as a one-time consequence, not a durable behaviour | none |
| 5 | info | coverage | STORY-104 | — | REQ-122 names three failures surfacing in the panel: missing API key, unreachable origin, model failure mid-turn. STORY-104 claims the first two (AC-1068, AC-1069) and leaves the third to CAP-90/STORY-103 ("a failure after streaming has begun delivered inside the stream"). This matches REQ-122's own evidence partition, which lists the mid-turn failure under the host suite and only the two under the panel suite. Not a gap | none |
| 6 | info | exclusivity | STORY-104 | — | Sole story in CAP-91, so no intra-capability overlap. Checked the neighbours that share the same intents: STORY-103 (CAP-90, the conversation host), STORY-105 and STORY-106 (the control surface), story-e674c60a (CAP-85, the split's frame). Each pair carries reciprocal out-of-scope clauses; the partition "the host owns the conversation, this story owns what the browser shows of it" holds in both directions | none |

## Notes for the Editor

- **The one repair, if taken, is an AC not a story-body edit.** Finding 1 is the
  only open item. STORY-104's body already discusses markdown; what is missing is
  a criterion. An `ac-add` at the ac level closes it without touching the story.
  If instead the operator judges that a CDN-loaded, degrade-by-design renderer is
  not something this matrix should assert, the clean resolution is a note on
  REQ-122 withdrawing the clause — not a second silent omission.
- **Ledger is unusually short by construction.** This capability was created by a
  single reconciliation of BUNDLE-17 on 2026-08-10 and has been touched by no
  intent since. Every request created after the bundle (REQ-131 through REQ-148)
  was checked; the closest, REQ-131, names "surfacing the journal to the client in
  the builder UI" under its own *explicitly out of scope* heading, so no imminent
  intent adds a pane behaviour.
- **One evidence-shaped note carried in the story body** — "Existing free-coded
  evidence proves tool activity at the host's stream rather than in the pane …
  verification is expected to be observed in the pane" — is a live item for the
  **uat** level against AC-1066, not a story-level finding. It is flagged here so
  the uat cycle does not have to rediscover it.
