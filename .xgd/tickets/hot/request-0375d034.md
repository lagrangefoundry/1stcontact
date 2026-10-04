---
uid: request-0375d034
id: REQ-388
type: request
title: 'Preview width: a width control on the draft, and the consultant is told which
  width the client is viewing'
created_by: EPIC-19
created_at: '2026-10-04T20:51:27.988344+00:00'
updated_at: '2026-10-04T21:37:32.744065+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0751884f
---

## What changes

The client and the consultant **always know which width the draft is being looked at**, so they discuss the same layout.

## Why

The builder's preview has no width control. The draft renders at whatever width the pane happens to be (set by the divider and the window size), often between the tablet and desktop layouts, and it can cross a breakpoint as the client resizes. The consultant isn't told that width: no message, digest or tool result carries it, and its `screenshot` defaults to `desktop`. The browser already measures the preview's viewport (`builder/points.js` ~L257), but the figure never reaches the server. So a client complaining about a layout they see at about 800px can get a desktop screenshot, a "looks fine", or a fix to the wrong breakpoint. (EPIC-19, operator question 2026-10-04.)

## Requirements

1. **A width control on the preview**, beside "Open in a new tab": **Desktop · Tablet · Phone · Fit pane**. Desktop, Tablet and Phone render the draft at fixed widths taken from the site's own viewport ladder (L1 `widths`), scaled down to fit the pane if necessary, never reflowed to the pane. Fit pane is today's behaviour. The choice is remembered per user, like the builder's other layout preferences. It applies in both View and Edit modes.
2. **The width is reported with every prompt.** The builder sends the preview's current rendered width, and which control is selected, with each chat submission.
3. **The consultant's per-turn digest states it as a fact**, for example *"The client is viewing the draft at 812px (Fit pane — between the tablet and desktop layouts)"*, naming which of the site's layout widths it falls between.
4. **`screenshot` can look at the client's width.** A `viewport` value meaning "the width the client is viewing", resolved from the reported width, so the consultant can see exactly what the client sees.
5. **Judging names the width.** The consultant's manual already says to name the width it judges at. The priming adds: when the client comments on how something looks, assume they mean the width they're viewing, check at that width first, and say which width any change was made for.
6. **The comp viewer** (REQ-378) and **View on your phone** (REQ-376) are unaffected, except that the comp viewer's desktop/phone toggle uses the same control styling.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- Choosing Phone renders the draft at the site's phone width regardless of pane width; Fit pane follows the pane.
- A chat submission carries the preview width and mode, and the next turn's digest states them.
- `screenshot` with the client-width option captures at the reported width.
- The priming names the client-width rule.


## Design

- **Where the ladder comes from.** The page listing (`editPageList`, the rows the builder's page selector already holds) carries each page's L1 `widths`. The three fixed choices are the ladder widths nearest the nominal 375 / 768 / 1280 (the same nominals as `screenshot`'s `mobile` / `tablet` / `desktop`), so a site whose ladder is `[320, 375, 768, 1024, 1280, 1440]` renders at 375 / 768 / 1280. No ladder (no pages yet) falls back to the nominals.
- **The pane.** `panel.setViewport(width | null)` lays every frame out at that width and, when the pane is narrower, scales it down with a CSS transform (never reflowed); when the pane is wider it is centred. `null` is Fit pane. It re-fits when the pane is resized. Both channels' frames follow, so View↔Edit keeps the width.
- **The control.** A toolbar action `preview-width` beside "Open in new tab" in View and Edit: a segmented group *Desktop · Tablet · Phone · Fit pane*, with the rendered width in its tooltip. The choice persists in the builder's per-user storage under the site tab's `preview-width` key. The comp viewer's Desktop/Phone toggle takes the same segmented-control class.
- **The wire.** Each chat submission posts `view: {width, mode}` with `/api/ai/prompt` (`mode` ∈ desktop · tablet · phone · fit, `width` the frame's actual layout width in CSS px). The route refuses a malformed `view` with 400; an absent one is ordinary (the `1c` CLI, older clients). It travels `streamPrompt → siteTurn` into the per-turn signal (`TurnSignal.view`).
- **The digest.** `SiteDigest` gains the site's layout widths (union of every page's ladder). The page digest adds one line when the turn carries a view, e.g. *"The client is viewing the draft at 812px (Fit pane) — between the 768px (tablet) and 1024px layouts."* — naming the ladder widths it sits between (or "the Npx layout" when it is exactly one, or "narrower than"/"wider than" at the ends).
- **`screenshot` at the client's width.** Picture `viewport` accepts `client`: resolved from the width reported with the current turn; a turn with no reported width refuses by name and says to use `mobile` / `tablet` / `desktop`. The picture's label says "at the client's width (812px)".
- **Priming.** Both consultant orders gain the rule: when the client comments on how something looks, assume the width they are viewing, look there first (`viewport: "client"`), and say which width any change was made for.
- Out of scope: the group-chat (room) exchange path does not carry the width yet; solo consultant turns do.
