---
uid: comment-b575fb2e
id: COMMENT-2626
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T22:46:19.848593+00:00'
updated_at: '2026-09-10T22:46:19.848593+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-199af2e9
  kind: note
---

**UAT Coverage: CAP-91 — PASS** (REPORT-3810 / `report-199af2e9`; 0 violations, 1 warning, 0 needs_review).

**Verdicts written**: AC-1062…AC-1070 all `pass`, STORY-104 `pass`, CAP-91 `pass`.

**What I actually verified**

- **Intent ledger re-walked.** STORY-104's intent is BUNDLE-17 (`free_and_reconciled`). Only REQ-122 and REQ-127 touch the pane; REQ-127 supersedes REQ-122's *mechanism* (site identity left the pane, the async guard moved to `app.js`) but not its observable outcome. I re-walked all 44 intents created since 2026-08-09 — REQ-145/146 moved the origin and host into workerd, BUG-38 fixed session resolution across isolates, all host-side. Nothing added, modified, or retired a pane-observable behaviour. All nine ACs are active; none unreviewed, so BUG-1306's impact screen never arises.
- **The suite was run, not assumed.** `npm test -- tests/reconciliation-builder-assistant-pane.test.ts` → **9 passed, 0 skipped**. This matters here: every `describe` is `describe.skipIf(!WEBUI_INSTALLED)`, so on a checkout without the shared `@lagrangefoundry/webui-*` store the whole capability's evidence would evaporate into nine green-looking skips. It's installed in this worktree.
- **Evidence validity holds.** All nine drive the real `mountBuilder` against the actually-installed `webui-chat`; the only injection is `chatTransport`, and `app.js:144-147` confirms it replaces just the HTTP layer (`openChatSession`/`streamChatPrompt`) — a genuine external boundary, not the thing under test. AC-1065 snapshots the list *from inside the stream generator* — the only observation that separates progressive arrival from one lump. AC-1066 observes tool activity in the pane's own DOM, which is exactly what the story's "Evidence note" demanded over the pre-existing host-stream evidence. AC-1070 holds one open unresolved and releases it late.

**The one finding** (warning, non-blocking, carried since 2026-08-16): REQ-122 says the panel "streams assistant turns, **renders markdown**, and shows tool activity" — streaming and tool activity are ACs, markdown rendering is nowhere in the tree except as a declared non-claim in Technical Context. I re-verified the wiring is still live (`loadMarked()`/`loadSanitizer()` at `apps/control-app/src/builder/chat.js:58-59`), and no intent withdrew the clause. Held at warning rather than escalated: the omission is declared with an accurate rationale, REQ-122's own evidence list doesn't name markdown either, and escalating an unrepaired warning on identical evidence would break determinism. Nothing needs fixing to clear this capability.
