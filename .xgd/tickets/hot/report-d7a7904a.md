---
uid: report-d7a7904a
id: REPORT-3807
type: report
title: 'Capability-Intent Alignment: Assistant Pane: The Conversation Beside The Page
  (level=story)'
created_by: xgd
created_at: '2026-09-10T22:32:19.336759+00:00'
updated_at: '2026-09-10T22:32:19.336759+00:00'
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

Re-derivation at 2026-09-10 of the story-level ledger last recorded by REPORT-2064
(`report-10937fa3`, 2026-08-16, PASS / 1 warning). This is not a copy: every intent
created after the bundle was re-walked because **four statuses moved** since that
report (REQ-131 `ready_to_reconcile` → `free_and_reconciled`, REQ-123 `free_coded` →
`free_and_reconciled`, REQ-146 `draft` → `free_and_reconciled`, and BUG-38 / BUG-39
did not exist), and the neighbour story STORY-103 was edited today. The single
carried-forward warning is re-verified against the tree and the code as they stand
now, not asserted from the prior report.

## Cumulative Intent Considered

CAP-91 carries no `intent_uid` and no `updated_by`; STORY-104 carries
`intent_uid = bundle-e59210c5` (BUNDLE-17, `free_and_reconciled`, `merged_at_commit`
`0198704b7e29db3c53cf569070042cec0eb467bc`) and no `updated_by`. The ledger was
therefore rebuilt by walking BUNDLE-17's eight member requests plus **all 42
requests/bugs created on or after 2026-08-10**, keeping those with a
browser-observable ask about the assistant pane.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell and the split, whose secondary held `builder-chat-placeholder` | YES (placeholder retired by REQ-122) |
| REQ-122 | free_and_reconciled | 2026-08-07 | Replaced the placeholder with a live `webui-chat` pane: streams turns, **renders markdown**, shows tool activity in the collapsible tool pane; one session per site; pane follows the toolbar with no selector of its own; rehydrate on mount and on every switch; draft keyed per site; missing key / unreachable origin / mid-turn failure explained without losing history | YES — sets the pane's whole behavioural surface |
| REQ-127 | free_and_reconciled | 2026-08-08 | Withdrew REQ-122's pane-held site identity: `createChatPanel` is handed an already-open session — no slug, no `setSite`, no `openSession`, no generation token; switch and async guard move to `app.js`; draft key `builder-chat:<slug>` → `builder-chat:<sessionId>` (declared one-time consequence) | YES (partial supersession of REQ-122) |
| REQ-123 | free_and_reconciled (was `free_coded` at REPORT-2064) | 2026-08-07 | System KB priming corpus for the session. "REQ-122 renders the chat UI; this ticket gives that session something to know" | NO — host/priming, no pane ask |
| REQ-126 / REQ-129 / REQ-130 | free_and_reconciled | 2026-08-08/09 | L1 control surface, tool declaration, config/module/metadata operations | NO — site control surface capability (STORY-105/106) |
| REQ-131 | free_and_reconciled (was `ready_to_reconcile`) | 2026-08-11 | Draft change journal. Re-read today: *"Surfacing the journal to the client in the builder UI … that is its own piece of work"* sits under **Explicitly out of scope** | NO — status moved to counting but still carries no pane ask |
| REQ-145 | free_and_reconciled | 2026-08-15 | `control-app` becomes the builder; `/api/ai/*` answers 501 and "the chat pane is dark on app.1stcontact.io" — a declared, ticket-naming deferral | NO — transitional state, superseded by REQ-146; not a durable pane behaviour |
| REQ-146 | free_and_reconciled (was `draft` at REPORT-2064) | 2026-08-15 | AI host moves into workerd. AC2 "reloading the builder resumes the site's conversation"; otherwise host-internal (archive, junction, audit, secret, bundling). "The structural properties should survive untouched" | YES (counts) — but adds no pane behaviour; AC2's pane-visible half is already AC-1063 |
| REQ-147 / BUG-36 / BUG-37 | free_and_reconciled | 2026-08-15…24 | Cloudflare Access; fresh-deploy 503; Edit-mode 1102 render cache | NO — origin/workspace, no pane ask |
| BUG-38 | free_and_reconciled (via BUNDLE-21, completed 2026-08-31) | 2026-08-24 | Chat turns fail in workerd: `minted` per-isolate map replaced by durable, tenant-scoped session-id resolution. The pane text is the **symptom**; the ask is host-side | NO for this capability — reconciled into STORY-103 (see finding 2) |
| BUG-39 | bundled | 2026-08-24 | Node chat-host UATs fail: the shared model double still speaks the pre-streaming Anthropic contract; one double in `tests/support/scripted-model-client.ts` | imminent — test-infrastructure; no pane behaviour (uat-level relevance only) |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the existing seam | imminent, no pane ask |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-155–157, REQ-158–161, REQ-163–166 | draft | 2026-08-20…31 | Capture in workerd; fidelity surface; system KB in the Worker; the Library tab; ingestion; corpus export | NO — not yet active. REQ-161 (the Library tab) is the one to watch: it is the first draft intent that would add a *second* browser surface beside the pane |

**Walked chronologically**: REQ-115 put a placeholder in the secondary; REQ-122
replaced it with a live pane and set the pane's entire behavioural surface; REQ-127
relocated the site binding out of the pane, leaving the externally observable result
identical; REQ-145 then REQ-146 moved the host underneath it from Node to workerd
without changing what the browser shows; BUG-38 made a turn survive isolate churn,
again underneath it. **Current cumulative intent for CAP-91 = REQ-122 as amended by
REQ-127.** No intent since 2026-08-08 has added, modified or retired a pane-observable
behaviour.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-91 (body) | REQ-122, REQ-127 | aligned — each scope bullet (live surface / following the displayed site / replay / per-conversation composing state / visible failure) traces to a REQ-122 clause; "no second control that could disagree" follows REQ-127's single-selector shape. Out-of-scope bullets match the reciprocal clauses in STORY-103 and STORY-99 |
| STORY-104 (body) | REQ-122, REQ-127 | aligned, one coverage warning (finding 1). No text in the body is unsupported by the ledger; the retired `builder-chat-placeholder` (REQ-115) appears nowhere in the tree; the REQ-122→REQ-127 supersession is recorded explicitly and correctly |
| STORY-104 → AC-1062…AC-1070 (9, all active) | REQ-122, REQ-127 | present and consistent with the story body; no deprecated or slug-era AC survives. Markdown rendering remains the one REQ-122 pane clause with no AC |
| STORY-104 ← REQ-146, BUG-38 (host moves) | REQ-146, BUG-38 | correctly **not** reflected — both are host-side; their pane-visible halves are already claimed by AC-1063 and by the existing failure path (findings 2, 3) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-104 | ac-add | **Carried forward from REPORT-2064 finding 1, re-verified today.** REQ-122 (`free_and_reconciled`, 2026-08-07) states the panel "streams assistant turns, **renders markdown**, and shows tool activity in the collapsible tool pane". Two of the three are criteria (AC-1065 streaming, AC-1066 tool activity); markdown rendering is expressed nowhere in the tree as behaviour — only in STORY-104's Technical Context as "Known upstream gaps, not claimed here … No criterion asserts rendered markdown". No intent in the ledger retired the clause, and the wiring is still live today: `loadMarked()` / `loadSanitizer()` at `apps/control-app/src/builder/chat.js:58-59`, imported from `@lagrangefoundry/webui-markdown` / `@lagrangefoundry/webui-chat` at lines 34-35. The stated rationale is evidence difficulty (CDN-loaded engines behind the components' own seams, degrading to escaped text — `chat.js:55-57`), which is not an intent withdrawal | Add an AC asserting the pane renders assistant markdown (degrading to escaped text when the engines do not load), **or** record an explicit intent-level withdrawal of the clause on REQ-122. Held at **warning**, not violation, for the same two reasons as 2026-08-16, both still true: the omission is declared in the matrix with an accurate rationale, and REQ-122's own panel-evidence list does not name markdown either. Nothing in the code or the ledger changed, so the classification does not change — escalating an unrepaired warning on identical evidence would not be deterministic |
| 2 | info | coverage | STORY-104 | — | **New since REPORT-2064.** BUG-38 (`free_and_reconciled`, via BUNDLE-21 `bundle-78f4e2fe`, completed 2026-08-31) is titled by a pane-visible string — *"That conversation is no longer open — reload the builder to start it again"*. It is nonetheless not a CAP-91 gap: the ask is durable session-id resolution in `host-core.ts`, it was reconciled into STORY-103 (`updated_by: bundle-78f4e2fe`) whose body now claims "a conversation identifier … resolved against durable, account-scoped storage", and BUNDLE-21 deliberately left CAP-91 untouched. The pane's *display* of that refusal travels the already-claimed error path — a non-OK `/api/ai/prompt` is rendered as pane text at `apps/control-app/src/builder/api.js:204-209`, the same path AC-1069 and AC-1065 assert over. Verified, not assumed | none |
| 3 | info | coverage | STORY-104 | — | **New since REPORT-2064** (REQ-146 was `draft` then, counts now). REQ-146 moved the host into workerd; its seven ACs are host-internal (bundled library, R2 archive, memory junction, durable audit, secret redaction, no-fs import graph, `publish` unreachable) except AC2 "reloading the builder resumes the site's conversation", which AC-1063 already expresses ("on first open and after the workspace is reloaded"). The ticket's own words — "the structural properties should survive untouched" — are the right reading: a runtime relocation, no new pane behaviour | none |
| 4 | info | consistency | STORY-104 | — | Every cross-reference in the Technical Context re-verified today: `story-a58a0974` = STORY-103 under `capability-7e4714b7` = **CAP-90**; `story-e674c60a` = STORY-99 under `capability-a994b8f3` = **CAP-85**. AC-973 (`acceptance_criterion-e1acae35`, active) has in fact been re-pointed — its body reads "it held when the secondary pane was a placeholder and it holds now that the pane hosts a live assistant" — so the story's claim that the placeholder criterion "is superseded and re-pointed to the live pane" is true, and no stale placeholder text survives in either tree | none |
| 5 | info | consistency | STORY-104 | — | The REQ-122 → REQ-127 supersession the body records is confirmed in the implementation: `apps/control-app/src/builder/chat.js` holds no slug, no `setSite`, no `openSession` and no generation token (its header says so by name), `setSession` is synchronous, `toolPane: true` is passed at mount, and the composer's draft key is `builder-chat:<sessionId>` (`CHAT_ID_PREFIX`, line 39). AC-1070 is therefore correctly stated as an outcome rather than a mechanism — the guard lives in `app.js`, not the pane | none |
| 6 | info | coverage | STORY-104 | — | REQ-127's draft-key migration (a draft typed before the change is not found after) is deliberately not a criterion. Correct: REQ-127 frames it as a one-time consequence, not a durable behaviour, and STORY-104 labels it exactly that | none |
| 7 | info | coverage | STORY-104 | — | REQ-122 names three failures surfacing in the panel: missing API key, unreachable origin, model failure mid-turn. STORY-104 claims the first two (AC-1068, AC-1069) and leaves the third to CAP-90/STORY-103, whose body claims "a failure after streaming has begun delivered inside the stream". This matches REQ-122's own evidence partition, which lists the mid-turn failure under the host suite and only the two under the panel suite. Not a gap | none |
| 8 | info | exclusivity | STORY-104 | — | Sole story in CAP-91, so no intra-capability overlap. All 45 stories re-scanned for a pane/conversation claim: STORY-103 (CAP-90), STORY-105/106 (control surface), STORY-117 (knowledge base). STORY-103 **was edited today** (`updated_at` 2026-09-10T22:03) so the partition was re-read rather than assumed: its out-of-scope list still names "**The browser pane.** The surface that renders the conversation for the operator is its own story". Reciprocal in both directions; no duplicate pane story has appeared | none |
| 9 | info | coverage | STORY-104 | — | The *collapsible* half of REQ-122's "collapsible tool pane" is not asserted either: AC-1066 claims the activity area's content ("shown in the pane's own area for it … a turn that reports no activity leaves that area with nothing in it") but not that it collapses. Same class as finding 1 — an upstream `webui-chat` affordance the repo only enables (`toolPane: true`) — and recorded here rather than as a second warning so the fix loop has one markdown-shaped decision to take, not two | none |

## Notes for the Editor

- **Nothing to repair to reach PASS.** Zero violations, zero needs_review. Finding 1
  is the only open item and it is a warning, unchanged in substance since
  2026-08-16: an `ac-add` at the **ac** level closes it without touching the story
  body, which already discusses markdown honestly. If the operator instead judges
  that a CDN-loaded, degrade-by-design renderer is not something this matrix should
  assert, the clean resolution is a withdrawal note on REQ-122 — not a second silent
  omission. Finding 9 should be decided the same way and at the same time.
- **Why the ledger stayed short despite four status moves.** CAP-91 was created by a
  single reconciliation of BUNDLE-17 on 2026-08-10 and has been touched by no intent
  since. Everything that has happened to the assistant in the three weeks after —
  REQ-145's 501 deferral, REQ-146's relocation into workerd, BUG-38's isolate-churn
  fix, BUG-39's streaming model double — happened *underneath* the pane, and each was
  reconciled into CAP-90 or CAP-85. That is the partition working, not a gap: this
  capability owns only what the browser shows, and what the browser shows did not
  change.
- **Live item for the uat level, flagged so that cycle need not rediscover it.**
  STORY-104's own Technical Context says "Existing free-coded evidence proves tool
  activity at the host's stream rather than in the pane … verification is expected to
  be observed in the pane." That is an AC-1066 evidence question, not a story-level
  finding. It is now compounded by BUG-39 (`bundled`): the shared streaming double in
  `tests/support/scripted-model-client.ts` is what the Node chat suites run on, and
  BUG-39 reports `test_UAT_FC_REQ-127_session_binding` and
  `reconciliation-assistant-conversation` each still leaving 1 failure from a
  different cause. The uat cycle should check those two suites' current state before
  trusting pane-level evidence drawn from them.
- **Watch item for the next story-level cycle.** REQ-161 (*The Library tab*, `draft`)
  is the first intent that would put a second browser surface in the workspace. If it
  activates, CAP-91's "the pane offers no second control that could disagree" and
  AC-1064's "exactly one place to choose a site" are the two statements most likely
  to need re-reading.
