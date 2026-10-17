---
uid: request-d3825c8a
id: REQ-403
type: request
title: 'First entry: a placeholder preview, no false ''All done'', and a ''Click here
  to start'' that opens with the consultant''s stock introduction'
created_by: EPIC-19
created_at: '2026-10-17T15:30:00.060690+00:00'
updated_at: '2026-10-17T16:29:21.919328+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cc05546b
  commits:
  - working_sha: 4e61f1b8f6018d0206a31085b71bee347919a01e
    reconcile_sha: null
    main_sha: null
  - working_sha: c2e0a8ddc5b50fd8f5cef9211e4a031a9a093410
    reconcile_sha: null
    main_sha: null
  version: 0.2.514
---

## What changes

The first time a client opens the builder for a new business, everything they see should explain itself. Today the three panes each say something misleading or nothing at all. Decided with the operator on 2026-10-17.

## Requirements

### 1. The preview pane before anything has been built

**Today:** the pane shows the starter page seeded for every new business. Its heading is `STARTER_HEADING = 'Your 1stcontact site'` (`apps/control-app/src/identity.ts`), so the client sees a web page that isn't their site, spelled "1stcontact" rather than "1st Contact".

**Wanted:** until the consultant has built a first page, the preview pane shows a **plain grey panel** with centred text: **"Your site will appear here as it's created."** It must not look like a web page.
- As soon as a real page exists, the pane shows it as usual.
- The implementer chooses how to tell "nothing built yet" from a real page: not seeding the starter, or recognising it. Whichever is chosen, the client never sees the starter heading, and the starter page is never published.
- Wherever the product name still appears in client-facing text, it's written "1st Contact".

### 2. The question panel before any question exists

**Today:** with no questions at all, the panel shows `PLAN_ALL_ANSWERED`: *"All done — thanks, that's everything I need for now."* That's false, because nothing has been asked yet.

**Wanted:**
- **The "All done…" text is removed entirely,** in every state, not just at the start.
- The **OPEN QUESTIONS** and **WHAT YOU'VE TOLD US** sections (REQ-401) appear **only when they have something in them.** At the start there are none, so neither heading shows.
- The progress banner (REQ-398, BUG-209) is unchanged.
- **The comps board ("Sites we're comparing", REQ-378/401) is an open question like any other** (decided with the operator, 2026-10-17). It does not appear until the consultant raises it. She raises it with a new plan operation, **`ask_comps`**, which works like `ask_features`. The board is also shown once a comp is on it or it has been settled (done or skipped). Until then it is hidden, so it doesn't fill OPEN QUESTIONS at the start.
- With no open questions, the count line under the banner is hidden rather than replaced by other text.

### 3. The chat before the session starts

**Today:** an empty conversation with a text box.

**Wanted:**
- **A brand-new conversation shows one button in the centre of the chat pane: "Click here to start".** There's no text box, no transcript and nothing else.
- **Clicking it makes the consultant's opening message appear,** typed out as if streamed. It's **stock text, not a model call**: no API request, no spend.
- **The opening message is recorded as a real assistant turn in the conversation's history**, so the model sees it as its own first message on every later turn, and it's shown again on reload like any other turn.
- **After the message has appeared, the text box appears** and the client replies as normal. The client's reply is the first message sent to the model.
- **It happens once per conversation.** A conversation that already has turns never shows the button. A reload after clicking shows the transcript, not the button.

**The stock opening message** covers three things, in the consultant's voice (DOC-66: no personal name, "I" and "you"):
- **(a) Who the consultant is and what it's for:** it designs and builds the site with the client, gives honest opinions, and the client always has the final say.
- **(b) The process,** following the stages in the progress banner: getting to know the business, looking at other sites, a first draft, refining, colours and fonts, finishing touches, ready to publish. It also says the client can move around freely.
- **(c) How working together goes:**
  - the questions panel above the chat collects simple facts, filled in whenever suits;
  - the preview shows the site as it's built, with "View on your phone";
  - the consultant tells the client before long pieces of work and roughly how long they'll take;
  - when there are several looks, the client tells the consultant which they prefer;
  - uploads (photos, logo, flyers) are welcome.

The message ends with the consultant's first question about the business. It's written once, in one place beside the other builder copy and the stage list it describes, and kept short enough to read in under a minute.

**This replaces REQ-399 §4** ("the consultant speaks first" via a host-run model turn). Its purpose stays: the consultant opens the conversation. Its mechanism changes from a model call to stock text the client releases with the button. Wherever REQ-399's code already implements §4, it's replaced, not kept alongside.

## Design decisions (2026-10-17, made during implementation)

- **The opening is recorded as two turns.** The upstream history window (`recentTurnPairs`, lagrange-framework) starts at the first *user* turn, so a conversation that begins with an assistant turn would have the opening dropped from what the model sees. Clicking the button therefore records a hidden opening cue as a user turn, then the stock text as the assistant turn. Both use upstream's existing `SessionManager.postTurn`: no model call, no turn ledger, no spend. The client's transcript filters out the cue, as REQ-399's did, so they see exactly one assistant turn. The model always sees the cue and the opening as the exchange before the client's first message. No change in lagrange-framework.
- **A new route, `POST /api/ai/opening {sessionId}`,** records the opening and answers `{turn: {role, markdown, ts}}`, or 409 when the conversation has already started. It replaces the `opening: true` branch of `/api/ai/prompt` and REQ-399's model-driven opening, which are deleted. `/api/ai/session` still says `opening: true` only for a conversation with nothing in it.
- **The pane types the opening out itself:** a few words at a time, then the composer appears.
- **"Nothing built yet" means the site still holds only the untouched starter page.** The starter is still seeded, because a site with no pages at all risks breaking render, publish and the editor. The origin recognises it with `nothingBuilt(store, site)` in `scaffold.ts`: the site's change counter is 0 (the seeding write records no change; every edit by the consultant or the client does), and its one page carries `STARTER_HEADING`.
  - While that holds, the draft preview route answers a plain grey page: centred text, no heading, marked `data-preview-placeholder`. It's stamped with the change count like any render, so the first write's `site_changed` reload replaces it with the real page.
  - `publishSite` refuses with `NothingBuiltError`, which the router maps to 409 `code: NOTHING_BUILT`. This covers the toolbar, the CLI and the consultant's publish tool alike.
  - `STARTER_HEADING` moves beside `starterHomePage` in `scaffold.ts` (`identity.ts` re-exports it) and becomes **"Your 1st Contact site"**.
- **The opening's wording lives in `plan-seed.json` as `opening`, beside `stages`**: one markdown line per entry, about 200 words. The hidden cue the model sees before it is the `opening-cue` template in `priming.json`, which replaces REQ-399's `opening-turn`.
- **The comps trigger:** `ask_comps` is a new KeepComps operation with no parameters. It sets `fields.comps_asked_at` once; raising it again keeps the first time. `panelView` adds `comps_raised`, which is true when `comps_asked_at` is set, a comp is on the board, or the board is done or skipped. The consultant's per-turn plan reminder says "Not yet raised: the comp board. Raise it with ask_comps…" until then, and both priming variants say the board isn't on the panel until she raises it.
- **The start button:** it is disabled while the request runs. A refused press (409, started in another tab) re-reads the conversation and shows its transcript; any other failure puts the button back with "That didn't start — please try again." The text is typed three words every 40 ms, and the composer is hidden by CSS until typing finishes.

## Existing tests changed by this ticket

- `test_UAT_FC_REQ-399_consultant_speaks_first.workers.test.ts` and `test_UAT_FC_REQ-399_pane_opens_the_conversation.test.ts` are **deleted**: the behaviour they pinned (REQ-399 §4) is replaced, and this ticket's UATs cover its successor.
- `test_UAT_FC_REQ-379_..._all_done_at_zero` is renamed `..._nothing_at_zero`. It now asserts the count line is hidden and empty, with no "All done".
- REQ-378's and REQ-401's panel suites give their hand-built views `comps_raised: true`, since the board is now only drawn once raised.

## Out of scope

- The wording of everything after the opening message.
- The features question (REQ-399 §1–3).

## Test plan

UATs `test_UAT_FC_REQ-403_*`, in three files: `first_entry.workers` (the routes), `first_entry_panes` (jsdom: panel and chat pane) and `comps_board_waits_for_the_consultant` (node: `ask_comps` through the real Toolbox):

- **A new business with nothing built:**
  - the preview shows the grey placeholder with "Your site will appear here as it's created." and no starter-page heading;
  - after a page is built, the page is shown.
- **The question panel of a new plan:** no "All done" text, and no OPEN QUESTIONS or WHAT YOU'VE TOLD US heading; the comps board is not shown. With one open question, only OPEN QUESTIONS shows. With every question answered there is still no "All done" text.
- **The comps board appears once the consultant raises it** with `ask_comps`, and also when a comp is on it or it has been settled.
- **Publishing a site that holds only the starter page is refused.**
- **A new conversation renders only the "Click here to start" button,** with no composer.
  - Clicking it appends exactly one assistant turn with the stock text, makes no model request, and records no spend.
  - The composer appears after the message has appeared.
  - On reload the transcript is shown with the opening message and there's no button.
  - A conversation that already has turns never shows the button.
- **The client's first message reaches the model with the opening message in its history** as the preceding assistant turn, itself preceded by the cue as a user turn.
- **While the opening is being typed, the composer exists but is hidden,** and the bubble holds only part of the text.