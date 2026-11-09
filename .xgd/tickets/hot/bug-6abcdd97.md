---
uid: bug-6abcdd97
id: BUG-409
type: bug
title: 'Consultant: a requested review and launch plan aren''t handed over to discuss
  and approve, and a host nudge buries them under a new question'
created_by: EPIC-19
created_at: '2026-11-09T17:43:38.362560+00:00'
updated_at: '2026-11-09T20:51:51.262032+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fceab690
  commits:
  - working_sha: 043020be4ffdf3384d2e3d9525541fc09c332828
    reconcile_sha: null
    main_sha: null
  - working_sha: 530e3c38994724641e1c8ef2f7a392fa7dce3414
    reconcile_sha: null
    main_sha: null
  version: 0.2.855
  story_points: 13
---

## Symptom (client test site, production, 2026-11-09)

The operator asked: *"Please review the site and raise any issues you see. Can you make a plan for site launch? What is missing?"* The consultant ran a review (`critique`), answered its findings, rewrote the site's plan (`set_plan`: eight activities, from "settle who Lauren is" to "publish, then a test order") and replied. But:

1. **The plan was never presented for discussion or approval.** The reply mentioned it in one line ("I've put a launch plan at the top of Input"), with no link, no summary of its steps, and no question about it. It ended on a different question (the business name). `set_plan` silently replaced the previous plan, with no "proposed" state and nothing on the Input board asking the client to agree. Operator: *"It never pointed me at the plan or asked me to discuss or approve it."*
2. **The review's conclusions were buried.** The findings were in that 17:28 reply. Thirty seconds later the host sent its "your client is still owed…" nudge about a task the consultant had created from the client's own request ("check about 5 sample product pages"). That made the consultant post a second message, which ended by asking the client to open four product pages on their phone and report back. The review's verdict ("not ready to launch") and the plan dropped out of view. Operator: *"I had to ask it what it learned from the site review."*
3. **The review was left unfinished, and the work was handed to the client.** The consultant couldn't open any specific piece's page. It tried `screenshot` with `click "<name>"` on a collection card, which failed because each card's photo link and name link share one accessible name (PLATFORM_ISSUE-14). It then tried the address `/product/<slug>`, which is wrong: a piece's page is `/shop/<slug>` (`productPagePath`, REQ-633). The knowledge search didn't give it the address. It checked one piece instead of five and asked the client to check the rest.

## Expected behaviour

1. **A requested review ends in one hand-over:**
   - the verdict in a sentence;
   - the findings that matter, most important first;
   - the plan as numbered steps, with a link that opens it on the Input board;
   - one question asking the client to discuss or approve the plan (and any decision the plan needs from them).
   Nothing else is asked in the same message.
2. **A plan the consultant writes in reply to a request is shown as proposed until the client agrees, without blocking any work** (decision 2026-11-09, option 1a; REQ-657/REQ-638 keep agreement optional, and DOC-82 rules out new host gates). When `set_plan` writes a plan that hasn't been agreed, or replaces one that has, the plan is marked not yet agreed. The Input board shows it as "Proposed — waiting for you", with the last agreed plan folded underneath it. The consultant asks for approval in its hand-over (item 1). Approval is recorded through the existing `agree_plan`, in the client's words. No tool refuses work while a plan is unagreed. The consultant's guidance says not to start new later steps of a proposed plan until the client has answered, except steps the client already asked for.
   - **Approve / Suggest changes on the Input board.** "Approve" sends a chat message in the client's name ("I approve the plan"), which the consultant records with `agree_plan`. "Suggest changes" opens the message box with a starter line ("I'd like to change the plan: ") for the client to finish, and sends nothing by itself. Neither button records anything without going through the conversation.
3. **Host nudges never bury a hand-over.** While the consultant's last message to the client holds an unanswered hand-over question, the host holds its "still owed" and layout reminders (as BUG-405 items 7–10 do for layout findings), unless the owed item is quick and can be done without a new question. A continuation that does go ahead must not end on a different question: it adds its result and repeats the pending one.
4. **The consultant never hands its own checks to the client.** If a tool limit stops a check the client asked for, it says what it couldn't do and why, and reports the limit (as it did). It doesn't ask the client to do the check, unless the check genuinely needs the client (their own phone, their own account).
5. **The consultant can open any piece's page.** `screenshot` accepts a piece by name or slug and opens `/shop/<slug>`, and the knowledge base states the address. On every catalogue card the photo's link is hidden from screen readers and keyboard tabbing (`aria-hidden`, `tabindex="-1"`) because it repeats the name link. It stays clickable with a mouse or finger. Each piece then has one accessible link, so a click by name works and a screen reader announces each piece once. This is a shared framework change: every shop picks it up at its next publish (decision 2026-11-09).

## Test plan

UATs `test_UAT_FC_BUG-409_*` (all in `tests/`):
- `a_review_ends_in_one_hand_over.workers` — a scripted review turn (critique, answer a finding, `set_plan` rewriting the client's plan, the hand-over) on the real worker: `critique`'s result tells the consultant the hand-over (the verdict in a sentence, the findings that matter most-important first, the plan as numbered steps with `[the plan](#show=plan)`, one question asking for approval, nothing else asked, and no check of its own handed to the client); `set_plan`'s result says the plan is proposed and to ask for approval; the plan is stored unagreed; and no host cue carries the message on past the hand-over.
- `the_plan_is_proposed_until_agreed` — a first plan is proposed; `agree_plan` in the client's words makes it agreed, with their quote; statuses moving on keep it agreed; a rewrite is proposed with the agreed plan as `previous`; other plan writes are not refused meanwhile; the client's yes makes the rewrite the plan. An agreement stored before this change (no kept route) reads a rewrite as proposed.
- `proposed_plan_on_the_input_board` — the real builder: "Proposed — waiting for you", the earlier agreed plan folded under "The plan you agreed before"; Approve posts "I approve the plan." as the client's message, and after `agree_plan` the board shows "Agreed with you" and the client's words; Suggest changes fills the message box with "I'd like to change the plan: " and sends nothing; the hand-over's `#show=plan` link opens the plan on the Input board.
- `a_nudge_never_buries_a_hand_over.workers` — with a hand-over question unanswered, a task created in the same request doesn't trigger the "still owed" cue; after the client answers, the next message's hand-back is cued, naming the task.
- `screenshot_opens_a_piece.workers` — `screenshot` with a piece's name (any case or spacing) or slug opens `/shop/<slug>`; a name not in the shop is refused before any page opens, naming pieces and the address form.
- `catalog_card_one_link` — on a rendered grid each piece has two links (photo, name) but exactly one in the accessibility tree and tab order (the name); the photo's link carries `aria-hidden="true"` and `tabindex="-1"` and the same href; `click "Brass lamp"` through `screenshot`'s own step script finds one link and clicks the name.

## What changed (2026-11-09)

1. **Review hand-over** (`plan-core.ts`, `REVIEW_HAND_OVER`): `critique`'s `next` always ends with the hand-over instruction (item 1), including item 4's "never hand a check of yours to them: say what a tool stopped you checking, and why".
2. **Proposed plan** (`plan-core.ts`): `agree_plan` now keeps the route it agreed (`plan_agreed.activities`). A plan is agreed while its activities match that route in kind, order, wording and in/out. Status moves (next → now → done) are the plan being followed, so they never un-agree it. `planProposed` is "written and not agreed". `set_plan` backfills the kept route for an agreement recorded before this change, so a rewrite of it reads as proposed. An agreement given before any plan was written ("just build it") keeps no route, and the first plan written under it stays agreed (REQ-638's "the plan they agreed, or left to you"). When the plan is proposed, `set_plan`'s result carries a `say` (added after the write's 200-character clip, as `set_ask`'s is) telling the consultant to list the steps numbered, link `[the plan](#show=plan)`, ask for approval as the message's one question, record the yes with `agree_plan`, and not start a new later step before the client answers, except one they asked for. Nothing is refused while a plan is unagreed. `panelView().plan` adds `proposed`, `previous` (the agreed route, while a different one is proposed) and `quote` (the client's words, while agreed).
3. **Input board** (`plan-route.js`, `config.js`, `builder.css`, `app.js`, `chat.js`): "Proposed — waiting for you" with **Approve** (sends "I approve the plan." through the chat, exactly as a typed message) and **Suggest changes** (puts "I'd like to change the plan: " in the message box, focused, and sends nothing; new `compose` on the chat panel). The earlier agreed plan is folded in a closed `<details>`. An agreed plan shows "Agreed with you" and the client's quote.
4. **Host hold** (`host-core.ts`): in `continuedTurn`, a "still owed" promise cue is held when the reply ends asking the client something (`asksClient`, BUG-405's check). The held promises' start time is remembered per conversation (`promisesHeld`), so the client's answer opens a message in which they are still owed and cued. Any continuation that does go ahead after a reply that ended on a question gets a `pending-question` tail (priming template): end by asking that question again, after the result, and ask nothing new.
5. **Rule 12** (priming `rules`): "Your checks stay yours: when a tool stops one your client asked for, say what you couldn't check and why, and report the limit; never ask them to do it, unless it truly needs them (their own phone, their own account)."
6. **Opening a piece** (`picture.ts`, `fidelity-core.ts`, `fidelity-surface.json`, `preview.ts`, `shot.ts`): picture sources take `product` (a name or slug) for `draft`, `edit` and `revision`. It resolves through the preview renderer's live catalogue (`PreviewRenderer.products()`) to `/shop/<slug>`, and the look is recorded against that page. An unknown piece is refused with up to five nearby names and "A piece's page is /shop/<slug>". The system KB (DOC "What the tool can do today") now says `/shop/<slug>` and points at `screenshot`'s `product`.
7. **Catalogue cards** (`packages/framework/src/l1/render.ts`): `bindL1` marks a record's photo link as repeating when a bound text in the same card also links to the record's page, and the emitter writes `aria-hidden="true" tabindex="-1"` on that photo's `<a>`. It still navigates on a pointer click. A card with no name link keeps its photo link accessible. Every shop picks this up at its next publish.

## Design decisions made during implementation

- **The "quick owed item" exception (item 3) isn't a host judgement.** The host can't tell whether an owed task is quick, so the promise cue is always held while a question waits. The consultant can still do a quick item in the same message on its own initiative.
- **No prompt trim.** The consultant's authored prompt was already over its REQ-466/REQ-473 budget on clean xgd-working (202,798 vs 191,200). This ticket adds 287 characters (rule 12's sentence), bringing it to 203,085. Per the standing direction, the overrun is reported here for a deliberate review, not trimmed in this ticket.

## Decisions (2026-11-09, operator, answering the implementing session's questions)

- **Plan approval: option 1a**, light. The plan is marked unagreed and shown as proposed, the consultant asks, and approval goes through `agree_plan`. There's no gate on work (item 2). The earlier wording, "work on later steps doesn't start before approval", is now consultant guidance, not a host refusal.
- **The buttons go through the conversation:** Approve sends a message, and Suggest changes opens the message box for the client's own words.
- **Hide the duplicate photo link** on catalogue cards for every shop (item 5).
- **All five parts stay on this ticket.** Part 3 (holding nudges while a hand-over question is open) reuses BUG-405's "the last reply asks the client a question" check rather than adding a second one, and merges after BUG-405.