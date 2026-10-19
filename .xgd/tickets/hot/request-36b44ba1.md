---
uid: request-36b44ba1
id: REQ-413
type: request
title: 'Builder: the consultant brings the right view to the client — switch the preview
  itself, or give a link the client follows'
created_by: EPIC-19
created_at: '2026-10-19T21:10:05.006619+00:00'
updated_at: '2026-10-19T22:38:32.732430+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6acbc860
  commits:
  - working_sha: b570c2a09f8cdd13f39ad0d1895f70f80143410d
    reconcile_sha: null
    main_sha: null
  - working_sha: eff4d5d75efa79077b413d8845c4f84d78e5ac95
    reconcile_sha: null
    main_sha: null
  version: 0.2.544
---

## What the client experiences

The builder now has a lot on screen: the preview in View, Edit or Story mode, a looks carousel, comparison sites shown in the preview, the progress bar, and the questions panel. A novice won't know where to look. **The consultant should bring each surface to the client at the moment it matters, saying where to look and what to do**, so the client never has to work out what the modes are or hunt for them (operator, 2026-10-19, EPIC-19).

Two ways, both wanted, because we need to try both:

1. **The consultant switches the view itself.** For example: *"The three looks are ready. I've put them in front of you."* The preview changes to that view as the consultant's message arrives.
2. **The consultant gives a link the client chooses to follow.** For example: *"[Open the story board](…) when you have a minute"*. Clicking it changes the view. Links stay in the transcript and still work after a reload, while an automatic switch happens once.

## Requirements

1. **One "show the client" operation** on the consultant's surface. Its targets are:
   - the draft, at a given page;
   - Story mode;
   - the looks for a page, at a given look;
   - a comparison site;
   - a question on the panel, which is scrolled into view, expanded and briefly highlighted.

   The consultant passes the target and either `switch` or `link`.
2. **`switch`** changes the client's preview, or highlights the panel item, when that part of the consultant's turn reaches the browser, through the live turn stream. It's recorded in the transcript, so a reload shows that the view was changed, but doesn't change it again.
3. **`link`** returns a markdown line the consultant pastes into its reply, the same pattern as images in the chat (REQ-217). The chat panel recognises the link and changes the view in place. It never opens a new tab or leaves the builder. An unknown or no-longer-valid target, such as a deleted look, shows a short "that's no longer there" note.
4. **Guard against switching under the client.** If the client is in Edit mode with unsaved changes, has the image editor open, or is mid-way through a panel answer, `switch` turns into `link`. The consultant's result says so, and the client sees the link instead. The view is never changed under someone who is working.
5. **The client is never stuck.** After a switch, the client's own controls (mode buttons, "Back to your draft", the page selector) work exactly as they do now.
6. **The consultant's instructions:** bring a surface forward when there's something new on it or something the client needs to do there. Prefer `switch` right after you've made something to look at, and `link` for "when you have a minute". Never switch twice in a row without the client doing anything in between.
7. **This works in both 1:1 and group-chat mode.**

## Test plan

UATs `test_UAT_FC_<id>_*`, through the real builder with only the model scripted:
- `switch` to Story while the client is in View: the preview's mode is Story when the turn finishes;
- `switch` while the client has unsaved Edit changes: the preview doesn't change, and a link appears in the reply;
- a `link` to a look: clicking it shows that look in the carousel, and it still works after a reload;
- a `link` to a deleted look: the "no longer there" note appears;
- `switch` to a panel question: it's expanded and highlighted;
- a reload after a `switch` doesn't switch again.

## What landed (free-coded)

**The operation.** `show_client` is on the plan surface, in the consultant-only `PlanWork` group beside `choose_look`. That group isn't narrowed in the workers deployment, so the consultant can call it everywhere. Its parameters are `target` (`draft`, `story`, `looks`, `comp` or `ask`) and `how` (`switch` or `link`). Optional parameters are `page`, `look`, `comp`, `ask`, and `label` (the link's words). It checks the target exists before answering:
- a page of the draft that is gone → `UNKNOWN_PAGE`;
- a look that was set aside, or a page with no looks on offer → `UNKNOWN_LOOK`;
- a site not on the comp board → `UNKNOWN_COMP`;
- a question that isn't on the panel → `UNKNOWN_ASK`, or `ASK_WITHDRAWN` for one that was withdrawn.

A question raised earlier in the same turn (`set_ask`) can be shown. The logic is in `tools/generate/src/cli/ai/show-core.ts`.

**The link** is a fragment, `#show=<target>&…` (for example `#show=looks&set=home-looks&look=home-coastal`), the same way `#looks=<set>` was (REQ-391). That older form is still accepted and means `#show=looks&set=<set>`. `link` answers `{how: 'link', link: '[Open the Coastal look](#show=…)'}` for the consultant to paste. The builder's chat panel follows it in place: it never opens a tab or navigates. When the target is gone, a short "That's no longer there." note appears beside the link and nothing else changes. That covers a set-aside look, a withdrawn question, a removed page and a comp no longer on the board.

**The switch** is guarded by the host. Each client message reports what the client is in the middle of, as `view.busy`: `editing` (an edit open on the page in Edit mode), `image` (the image editor open) or `answering` (text typed in a panel answer and not yet saved). While busy, `switch` comes back as a link with `not_switched` saying why. **A second switch in answer to the same client message also comes back as a link**, which enforces requirement 6's "never twice in a row". The client's next message resets that, and so do a room's later rounds and the host's continuations, because they answer the same message.

**How a switch is delivered and recorded.** The cadence wrapper on the consultant's backend (`cadence-core.ts`) does both:
1. After a `show_client` call that switched, it yields a line of the reply, `[Showing you the story board](#show=story)`. The manager records that line, so it is in the transcript, a reload shows it, and clicking it goes back to the view.
2. It then yields a `show_client` event. The manager delivers that without recording it, so the browser acts on it once and a reload never switches again.

The browser checks `busy` again when the event arrives, because a turn can outlast what it was told at the start. If the client has become busy, the view isn't changed and the line stays as a link.

**Group chat.** A room's record is what members post, not their private replies. So in a group chat the switch result carries `say_in_room`, the same line for the consultant to put in what it says to the room. The live `show_client` event reaches the client through the room's stream like any other host signal.

**The client is never stuck.** A switch calls the same entry points the client's own controls use: `panel.setMode`, `pages.open`, `looks.open`, `openComp` (which has "Back to your draft"), and the panel's fold. A question is shown by unfolding it (remembered like the client's own unfold), scrolling it into view, and highlighting it for about 2.4 s (`plan-item--shown`, with a static ring under reduced motion).

**The consultant's instructions** are in `priming.json` as a new `showing` entry in both priming lists. The `looks` entry now says to bring the set forward with `show_client` instead of hand-writing `#looks=SET`. The op's description in `plan-surface.json` carries the switch/link guidance too.

## Test plan (as built)

The UATs are split the way the repo's other builder work is. No existing harness drives a browser together with a scripted model, so: the real Worker with only the model scripted (`tests/test_UAT_FC_REQ-413_show_the_client.workers.test.ts`), plus the real builder mounted in jsdom with the transports faked to carry exactly what the host sends (`tests/test_UAT_FC_REQ-413_show_in_the_builder.test.ts`).

Workers:
- a `switch` to Story streams one `show_client` frame and records the line before the consultant's next words; a reopened conversation holds the line and no frame;
- a `switch` while `busy: editing` streams no frame, and the result is a link with `not_switched`;
- a second `switch` in the same message becomes a link; the next message switches again;
- a `link` to a look answers the exact line and streams no frame;
- a question raised this turn can be linked, and a set-aside look is refused as `UNKNOWN_LOOK`;
- in a group chat, the consultant's switch reaches the client's stream and the result carries `say_in_room`.

Builder (jsdom):
- a `switch` to Story from View → Story, and the View button still works;
- with an edit open, the message reports `busy: editing`, an arriving switch doesn't change the view, and the reply's link works once followed;
- a `switch` to a panel question unfolds, scrolls to and highlights it;
- a `switch` to a comp opens it ("Back to your draft" is there), and a link to a draft page comes back to View on that page;
- a reload after a switch doesn't switch again, and still shows the line;
- a link to a look shows it in the carousel, and still works after a reload;
- a link to a set-aside look, or to a question no longer on the panel, shows "That's no longer there."