---
uid: request-0375d034
id: REQ-388
type: request
title: 'Preview width: a width control on the draft, and the consultant is told which
  width the client is viewing'
created_by: EPIC-19
created_at: '2026-10-04T20:51:27.988344+00:00'
updated_at: '2026-10-04T22:42:12.884277+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0751884f
  commits:
  - working_sha: 03fb0f5a4cbda6ca6dcde607ce576ee7ec61e22b
    reconcile_sha: null
    main_sha: null
  - working_sha: d635767904296333542b71fab11f4141c083418f
    reconcile_sha: null
    main_sha: null
  version: 0.2.493
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

UATs named `test_UAT_FC_REQ-388_*`:
- `tests/test_UAT_FC_REQ-388_preview_width.test.ts` (builder, jsdom, real `mountBuilder`): the control sits directly before "Open in new tab" in View and Edit with Fit pane default; Phone lays both channels' frames out at the ladder's 375px whatever the pane (scaled in a narrow pane, centred in a wide one), Desktop/Tablet land on 1280/768, Fit pane follows the pane; the choice survives a remount on the same storage; a chat submission carries `{width, height, mode}` (812/fit, then 375/phone with the laid-out height); the comp viewer's toggle wears `builder-segmented`.
- `tests/test_UAT_FC_REQ-388_the_consultant_is_told_the_width.test.ts` (real host, scripted model, recording browser double): a reported 812px states "between the 768px (tablet) and 1024px layouts" in that turn's digest and a later unreported turn says nothing; 375/phone reads "exactly the 375px (phone) layout"; `screenshot` with `viewport: "client"` lays out at 812 and labels it, and refuses by name on a turn with no width; malformed reports are not widths; the priming names the client-width rule in both orders.
- `tests/test_UAT_FC_REQ-388_the_route_carries_the_width.workers.test.ts` (real Worker route): `view` posted to `/api/ai/prompt` reaches the digest; a malformed `view` is a 400 before any model call.

### Existing pins updated deliberately
- `reconciliation-builder-toolbar-lifetime` AC970's View strip list now includes `preview-width` (before `open-new-tab`).
- `test_UAT_FC_REQ-157_fidelity_surface`'s picture viewport enum now includes `client`.

## Design

- **One definition of the widths.** `apps/control-app/src/builder/view-width.js` (import-free, like `email-shape.js`) holds the settings, their labels, the nominals and the nearest-ladder-width rule; the builder and `roles.ts` both import it, so "tablet" means the same width in the chrome and in the digest.
- **Where the ladder comes from.** The page listing (`editPageList`, the rows the builder's page selector already holds) carries each page's L1 `widths`. The three fixed choices are the ladder widths nearest the nominal 375 / 768 / 1280 (the same nominals as `screenshot`'s `mobile` / `tablet` / `desktop`), so a site whose ladder is `[320, 375, 768, 1024, 1280, 1440]` renders at 375 / 768 / 1280. No ladder (no pages yet) falls back to the nominals.
- **The pane.** `panel.setViewport(width | null)` lays every frame out at that width and, when the pane is narrower, scales it down with a CSS transform (never reflowed); when the pane is wider it is centred. `null` is Fit pane. It re-fits when the pane is resized. Both channels' frames follow, so View↔Edit keeps the width.
- **The control.** A toolbar action `preview-width` directly before "Open in new tab" in View and Edit: a segmented group *Desktop · Tablet · Phone · Fit pane*, with the rendered width in its tooltip. The choice persists in the builder's per-user storage under the site tab's `preview-width` key. The comp viewer's Desktop/Phone toggle takes the same segmented-control class.
- **The wire.** Each chat submission posts `view: {width, height, mode}` with `/api/ai/prompt` (`mode` ∈ desktop · tablet · phone · fit; `width` the draft's layout width in CSS px — the fixed width, or the pane's for Fit pane; `height` the visible height in the same layout pixels). The Worker route and the local `1c` builder origin both refuse a malformed `view` with 400; an absent one is ordinary (the `1c` CLI, older clients). It travels `streamPrompt → siteTurn` into the per-turn signal (`TurnSignal.view`).
- **The digest.** `SiteDigest` gains the site's layout widths (union of every page's ladder). The page digest adds one line when the turn carries a view, e.g. *"Your client is viewing the draft at 812px (Fit pane) — between the 768px (tablet) and 1024px layouts."* — naming the ladder widths it sits between (or "the Npx layout" when it is exactly one, or "narrower than"/"wider than" at the ends).
- **`screenshot` at the client's width.** Picture `viewport` accepts `client`: resolved from the width reported with the current turn; a turn with no reported width refuses by name and says to use `mobile` / `tablet` / `desktop`. The picture's label says "at the client's width (812px)".
- **Priming.** Both consultant orders gain the rule: when the client comments on how something looks, assume the width they are viewing, look there first (`viewport: "client"`), and say which width any change was made for.
- Out of scope: the group-chat (room) exchange path does not carry the width yet; solo consultant turns do.