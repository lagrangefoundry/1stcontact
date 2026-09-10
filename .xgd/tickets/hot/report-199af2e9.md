---
uid: report-199af2e9
id: REPORT-3810
type: report
title: 'UAT Coverage: Assistant Pane: The Conversation Beside The Page'
created_by: xgd
created_at: '2026-09-10T22:46:03.455405+00:00'
updated_at: '2026-09-10T22:46:03.455405+00:00'
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

Attempt 2 (previous_attempt_count = 1). This is a re-derivation, not a copy of
REPORT-2067 (2026-08-16): the AC bodies and story body were re-read from the tickets
today, the post-2026-08-16 intent tree was re-walked (four statuses moved and two bugs
were filed since that report), the test file was read in full, and **the suite was
executed** — which REPORT-2067 did not record. The verdict is unchanged because the
evidence is stronger, not because the prior report was assumed.

## Evidence actually executed

`npm test -- tests/reconciliation-builder-assistant-pane.test.ts` →
**1 file passed, 9 tests passed, 0 skipped** (620 ms).

This matters more than usual here: every `describe` in the suite is
`describe.skipIf(!WEBUI_INSTALLED)`, so a checkout without the shared
`@lagrangefoundry/webui-*` store would report nine green-looking skips and prove
nothing. `WEBUI_INSTALLED` is true in this worktree and all nine bodies ran.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-115 | free_and_reconciled | 2026-07-31 | The split, whose secondary held `builder-chat-placeholder` | YES (placeholder retired by REQ-122) |
| REQ-122 (in BUNDLE-17) | free_and_reconciled | 2026-08-07 | Originating: the secondary hosts a live `webui-chat` — message list + composer, streamed turns, **renders markdown**, tool activity in the collapsible tool pane; one session per site; follows the toolbar with no selector of its own; rehydrated on mount and on every switch; draft keyed per conversation; missing API key / unreachable origin / mid-turn failure explained without losing history | YES — sets the pane's whole behavioural surface |
| REQ-127 (in BUNDLE-17) | free_and_reconciled | 2026-08-08 | Withdrew the pane's *site identity*: `createChatPanel` takes an already-open session (no slug, no `setSite`, no `openSession`, no generation token); `/api/ai/prompt` takes `{sessionId, text}`; the async switch guard moved to `app.js`; draft key `builder-chat:<slug>` → `builder-chat:<sessionId>`, declared a one-time migration effect and explicitly not an AC | YES — supersedes REQ-122's *mechanism*, not its observable outcome |
| REQ-119 / 121 / 126 / 128 / 129 / 130 (BUNDLE-17) | free_and_reconciled | 2026-08-07 → 08-10 | Request-time render, copy-edit modal, L1 control-surface API, background-image picker, L1 authoring, structured config | YES, but none asks for pane behaviour |
| REQ-145 | free_and_reconciled | 2026-08-15 | `control-app` becomes the builder; the client becomes a build artifact | YES — moves what serves the pane, not what it shows |
| REQ-146 | free_and_reconciled (was `draft` at REPORT-2067) | 2026-08-15 | The AI host moves into workerd. "The structural properties should survive untouched"; its pane-visible half (a reload resumes the conversation) is already AC-1063 | YES — adds no pane behaviour |
| BUG-38 | free_and_reconciled (via BUNDLE-21) | 2026-08-24 | Chat turns failed in the cloud: the per-isolate `minted` map replaced by durable, tenant-scoped session-id resolution. The pane string is the *symptom*; the ask is host-side and reconciled into STORY-103 | NO for this capability |
| BUG-39 | bundled | 2026-08-24 | The shared model double still speaks the pre-streaming contract — test infrastructure at the *host* suites | imminent; no pane behaviour |
| REQ-131 / 133 / 139 / 140 / 141–144 / 147 / 149–153 / BUG-34–37 | free_and_reconciled | 2026-08-11 → 08-24 | Journal, palette, editor controls, store ports, deploy, publish, locale, copy-modal fixes | YES, none touches the pane |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |
| REQ-154–166 | bundled / draft | 2026-08-20 → 08-31 | Browser Rendering driver, capture in workerd, fidelity surface, system KB, Library tab, ingestion, corpus | NO — not yet active. REQ-161 (Library tab) is the first draft intent that would add a second browser surface beside the pane |

**Walked chronologically**: REQ-115 put a placeholder in the secondary; REQ-122 replaced
it with a live pane and set the pane's entire behavioural surface; REQ-127 relocated the
site binding out of the pane, leaving the externally observable result identical; REQ-145
then REQ-146 moved the origin and the host underneath it without changing what the browser
shows; BUG-38 made a turn survive isolate churn, again underneath it.
**Current cumulative intent for CAP-91 = REQ-122 as amended by REQ-127.** Nothing since
2026-08-08 has added, modified or retired a pane-observable behaviour, so no AC is retired
and none is unreviewed — all nine trace to a `free_and_reconciled` clause.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-104 | REQ-122, REQ-127 (+ REQ-146, BUG-38 as host-side context) | aligned | Every in-scope bullet traces to a REQ-122 clause as amended by REQ-127. The supersession is recorded explicitly in Technical Context, correctly, including why AC-1070 is stated as an outcome rather than a mechanism (the guard moved from `chat.js` to `app.js`; the observable result is identical). The declared one-time draft-key migration is correctly *not* an AC. One coverage warning carried — finding 1 |

## AC-by-AC evidence

All nine tests live in `tests/reconciliation-builder-assistant-pane.test.ts` and drive
the real workspace entry point `mountBuilder` (`apps/control-app/src/builder/app.js`)
against the **actually-installed** `webui-chat`. The only injection is `chatTransport`,
which substitutes `openChatSession` / `streamChatPrompt` — the HTTP layer, an external
boundary jsdom cannot serve, whose origin half is proven by the REQ-122/127/146 host
suites. `app.js:144-147` shows the injected seam replacing only that layer; the pane
logic under test is real.

| AC | Test | Why it substantively covers |
|---|---|---|
| AC-1062 | `test_UAT_AC1062_the_secondary_pane_is_a_working_conversation_for_the_displayed_site` | Asserts real `.chat-widget` + message list + composer in the split's secondary, that the send control is inert with nothing to send and live once typed into (a decorative composer fails), that `panel.getSite()` and the mounted `data-chat-id` agree, and that all of it was true with no operator action |
| AC-1063 | `..._the_pane_replays_what_the_conversation_holds_on_open_and_after_reload` | Compares rendered messages against the conversation's turns whole-record (order + speaker), destroys and re-mounts against the same storage for the reload leg, then asserts the empty site shows the component's real empty-state text rather than the other site's turns |
| AC-1064 | `..._changing_site_changes_the_conversation_and_only_the_toolbar_chooses` | Switches both ways with two distinguishable transcripts and asserts no leakage in either direction; asserts the *workspace-wide* selector count is exactly 1 and it is the toolbar's, plus the absence of `setSite`/`getSite` on the pane — the two ways a second control could exist |
| AC-1065 | `..._a_message_addresses_the_shown_conversation_and_the_reply_streams_in` | Snapshots the message list **from inside the generator, mid-turn**, which is the only observation that distinguishes progressive arrival from one lump at the end; asserts the turn carries exactly `[sessionId, text]` for the *newly shown* site, and that the result is one completed assistant message, not one per delta |
| AC-1066 | `..._what_the_assistant_did_is_shown_in_the_panes_activity_area` | Observes the activity in the pane's own DOM (`.chat-tool-pane-body`, `.chat-tool-event-name`) — which is exactly what the story's "Evidence note" demanded over the host-stream evidence — asserts the reply is still shown and did not absorb the tool name, and runs a second, quiet turn to prove the empty case shows nothing |
| AC-1067 | `..._an_unsent_draft_belongs_to_one_conversation_and_survives_a_round_trip` | Types without sending, leaves, asserts the other composer is empty, returns and asserts the exact text is restored and the list is still empty (nothing was sent on the way) |
| AC-1068 | `..._an_assistant_that_cannot_run_is_explained_with_the_history_intact` | `ready:false` with a reason and prior turns: asserts the pane still mounts, the earlier turns are intact *and in order*, and the appended notice names `ANTHROPIC_API_KEY` specifically rather than failing generically |
| AC-1069 | `..._an_unreachable_origin_is_reported_in_the_pane_not_left_blank` | `openSession` throws: asserts the conversation surface is still present, that one assistant message carries both "could not be reached" and the underlying `Failed to fetch`, and that neither a streaming state nor a visible empty-state persists |
| AC-1070 | `..._switching_faster_than_the_answers_arrive_leaves_the_last_chosen_site` | Holds alpha's open unresolved, switches to beta, releases alpha late; asserts the pane ends on beta, that none of alpha's turns landed, and that a subsequent send addresses beta's session. Stated as outcome, per REQ-127 — a workspace that adopted the last-arriving answer fails it |

No test in this set is trivial, structural (source-text grep), or over-mocked: none
mocks the pane, the workspace, or the component under observation.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-104 | ac-add | REQ-122 (`free_and_reconciled`) says the panel "streams assistant turns, **renders markdown**, and shows tool activity". Two of the three are criteria (AC-1065, AC-1066); markdown rendering is expressed nowhere as behaviour — only as a declared non-claim in Technical Context ("Known upstream gaps, not claimed here … No criterion asserts rendered markdown"). Re-verified in code today: `loadMarked()` / `loadSanitizer()` are still live at `apps/control-app/src/builder/chat.js:58-59`, imported at `:34-35`. No intent retired the clause | Add an AC asserting the pane renders assistant markdown and degrades to escaped text when the engines do not load, **or** record an explicit intent-level withdrawal on REQ-122. Held at **warning**, not violation, for the reasons recorded on 2026-08-16 and again on 2026-09-10 (REPORT-3807 finding 1), both still true: the omission is declared in the matrix with an accurate rationale, and REQ-122's own panel-evidence list does not name markdown either. Escalating an unrepaired warning on identical evidence would not be deterministic |

Zero violations. Zero `needs_review` — no AC or story clause is intent-silent, so the
BUG-1306 impact screen does not arise anywhere in this tree.

## Notes for the Editor

- **Nothing to fix to clear this capability.** The single warning is the same one carried
  since 2026-08-16 and is a matrix/intent question (does REQ-122's markdown clause become
  an AC, or get withdrawn?), not a code or test defect. It does not affect pass/fail.
- **If finding 1 is ever taken up**, the honest AC is the degrading one — "renders
  assistant markdown, and escaped text when the engines are unavailable" — because the
  swallowed `.catch(() => {})` at `chat.js:58-59` makes the offline path a real,
  reachable state rather than a hypothetical, and an AC that only asserts the online path
  would be unprovable offline exactly when it matters.
- **Guard the skip, not just the suite.** Every `describe` here is
  `describe.skipIf(!WEBUI_INSTALLED)`. On a checkout without the shared webui store the
  whole capability's evidence silently evaporates into skips. The skip is deliberate and
  its reason is documented in `tests/support/webui-installed.ts`, but any future reader
  of a green run for CAP-91 should confirm the count is **9 passed**, not 9 skipped.
