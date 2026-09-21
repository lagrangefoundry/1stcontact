---
uid: bug-9ca5a8fc
id: BUG-131
type: bug
title: 'Open in new tab opens the edit channel: the operator gets outline markers
  on a deliberately non-functional page'
created_by: EPIC-19
created_at: '2026-09-20T23:15:06.775879+00:00'
updated_at: '2026-09-21T00:01:42.693422+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
  story_points: 1
  chat_comment: comment-552601b3
  commits:
  - working_sha: 40e1d5ffed9358a77ccf407da54a2dc289581799
    reconcile_sha: null
    main_sha: null
  - working_sha: 308048a9bc4eccd8e4b211ad636ef7888b01fec7
    reconcile_sha: null
    main_sha: null
  version: 0.2.299
---

## What happens

In **Edit** mode, pressing **Open in new tab** opens a tab showing the edit
channel: every editable region wrapped in its faint outline, segment addresses
stamped on the markup, all of a page's modals shown at once, and nothing on the
page working — no links, no forms, no behaviour.

The operator asked to see the page. They were given the editor's scaffolding
with no editor attached to it.

## The spec says `draft`, and says so in the word

[[DOC-28]] §10 defines the control:

> **Open in new tab** | the *same* **draft** render URL the iframe loads — an
> iframe can distort layout, so a real tab is the honest view

The channel is named. It is `draft`, in both modes, and the rationale is the
reason it has to be: the control exists so the operator can see the page
*without* the builder's distortions. The edit channel is nothing but
distortions — that is its whole job — so opening it in a tab inverts the one
purpose the control has.

[[DOC-8]] §3.3 frames the same action the same way, as a *production-fidelity
check*: "a sanity check against renderer / build drift". A channel that is
deliberately not production cannot check fidelity against it.

## Root cause — the action follows the pane, and the pane is in `edit`

`openInNewTabAction` (`apps/control-app/src/builder/toolbar.js:192`) takes the
href straight off the panel:

```js
const sync = () => link.setAttribute('href', panel.getSrc())
```

and `getSrc` (`apps/control-app/src/builder/panel.js:403`) returns whatever the
iframe is currently displaying:

> The URL the pane is displaying. "Open in new tab" uses exactly this, so the
> tab and the iframe can never disagree.

In View that is `previewUrl(site, 'draft', …)` and the behaviour is right by
coincidence of the channels agreeing. In Edit the mode's `src` is
`previewUrl(site, 'edit', carry.pathFor(site))`
(`apps/control-app/src/builder/app.js:469`), so the tab gets
`/preview/<siteKey>/edit/<page>`.

The generalisation from *"the draft render URL"* to *"whatever the pane is
showing"* is the defect. It was safe while there was one channel and became
wrong when [[REQ-116]] added the second, and the invariant that replaced the
spec's wording — *the tab and the iframe can never disagree* — is the thing that
now has to go, because in Edit they **must** disagree.

## Why the edit channel is not something to open standalone

This is not a cosmetic difference between two renderings of the same page. The
edit channel is a distinct, deliberately crippled render, and the renderer says
so (`tools/generate/src/render/render.ts:54`):

> render the **edit** channel rather than the ordinary one … Deliberately
> non-functional (no link target, no form action, no behaviour or motion
> script), showing all content at once, with every editable region outlined and
> stamped with its address.

It emits `L1_EDIT_CSS` — "the faint per-segment outline" (`render.ts:238`) —
stamps `L1_EDIT_MARKER_ATTR` and the page attribute on `<body>` (`render.ts:262`),
and writes no client bundle at all (`render.ts:402`). The router says the same
from its side: *"The site is not intended to be functional in edit mode: the edit
render emits no `action` and no `method` and ships no client script"*
(`apps/control-app/src/router.ts:5134`).

So the tab is not a slightly-marked-up page. It is a dead one, and the markers
on it are addressed to a bridge that is not there.

## The fix

**In Edit mode the action points at the `draft` channel, at the page the pane
is on.** That is what [[DOC-28]] §10 already specifies, and the page is already
tracked — `carry.pathFor(site)` is what composes both modes' `src` today, so the
draft URL for the current page is one existing call.

Two properties to keep:

- **The href still tracks navigation.** The action subscribes to the panel's
  `src` event so the link follows the operator between pages
  (`toolbar.js:207`). Moving to another page in Edit must re-point the link at
  that page's *draft* URL rather than freezing on the first one.
- **View mode is untouched.** It already opens the draft channel; this changes
  which URL Edit composes, not how the action works.

The alternative — dropping `'open-new-tab'` from edit mode's `actions` list
(`app.js:491`) — is cheaper and self-enforcing, since the toolbar renders only
what the active mode names, so there is no way for the control to be present and
wrong. It is rejected because it removes a working affordance to avoid fixing a
one-line URL, and it makes an operator flip channel to do something the spec
says they can do from either.

## Secondary: a citation that points at the wrong section

Both [[DOC-28]] §10 and `panel.js:403` attribute this behaviour to
[[DOC-8]] §4.3. DOC-8 §4.3 is *"Edits are diffs, not full replacements"* and has
nothing to say about the preview or about tabs. The section that does is §3.3,
*"Production-fidelity check"*. Worth correcting while the surrounding lines are
being edited, so the next reader who follows the reference finds the argument
rather than a dead end.
---

## What was implemented

**The action asks the host for the honest URL.** `openInNewTabAction` now takes
`honestUrl(src)` — a function from the pane's current URL to the production
render of the same page — and re-derives the href through it on every `src`
event. `app.js`, which is already the only module that composes channel URLs,
supplies `(src) => previewChannelUrl(src, 'draft')`. `toolbar.js` stays free of
channel names and of imports; the one channel name in the fix sits beside the
mode registry that names the other one.

**The page is taken from the URL, not recomposed from the pane's state.**
`previewChannelUrl(url, channel)` (`api.js`) keeps everything up to and
including the site — scope prefix, site key — and the path after the channel,
replacing only the channel segment. It is the exact dual of the existing
`previewPageUrl`, and it is a fourth reader of the same URL shape for the reason
the other three are co-located: the shape is one fact.

Deriving the draft URL from `carry.pathFor(site)` instead — the composition the
two modes' `src` already use — would have been wrong in a way worth recording.
`src` fires at the moment the pane is re-pointed, *before* the new document has
arrived, so the carry still holds the page being left; the link would have
lagged one page behind on every move. The URL being navigated to is the only
thing that names the page being opened at that instant.

**Consequences the UATs pin**, beyond the two properties named above:

- **The business prefix survives the change of channel.** The draft URL is
  composed from the pane's own URL rather than from `previewUrl(site, …)`, so
  `/b/<businessId>` is carried through. Without it the tab would open another
  business's site — or the origin's unscoped fallback — from a link the operator
  can copy out of the browser.
- **The control is still offered in Edit.** The rejected alternative was to drop
  `'open-new-tab'` from edit mode's `actions`; the fix keeps it, so there is a
  claim to make that it is present *and* correct in that channel.
- **No reachable state of the control names the edit channel**, in any channel,
  on any page. Stated once as a negative over every state rather than implied by
  the positive cases.

## Supersession: AC-971, and REQ-115's AC 8

This intent deliberately changes behaviour two existing criteria pin, and both
are **INVALIDATED** as written:

- **AC-971** — *"open in a new tab always targets the displayed document"*
  (`reconciliation-builder-workspace-chrome`). True of one render channel and
  wrong of two. What survives is the half that was always the point: the control
  targets the *page* the pane is displaying and follows it. The channel is now
  always the production one.
- **REQ-115's AC 8** — *"identical URL, and it stays identical as the pane
  changes"* (`req115-builder-composition`). Written when there was one channel to
  be identical to. [[REQ-116]] added the second; this settles which one a tab
  opens.

`AC-1110` (a replaced control stops reacting) is **not** superseded — it used
this control as its probe and the probe's expected value moved with it. Its
assertions were re-pointed at the draft render; the lifetime claim is unchanged.

## Documentation corrected

- **[[DOC-28]] §10** — the citation moved from [[DOC-8]] §4.3 (*"Edits are
  diffs"*) to §3.3 (*"Production-fidelity check"*), and the row now says the
  channel is `draft` in **both** modes and why.
- **`panel.js`'s `getSrc`** — the invariant *"the tab and the iframe can never
  disagree"* is gone, along with the same misattributed citation. `getSrc`
  answers where the pane is and nothing wider; which channel a tab opens is the
  action's question.
- **`api.js`'s `previewUrl`** — no longer claims the tab "lands on the identical
  document"; it lands on the same origin, on the draft render of the page the
  pane is on.