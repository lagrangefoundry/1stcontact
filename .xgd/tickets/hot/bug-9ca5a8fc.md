---
uid: bug-9ca5a8fc
id: BUG-131
type: bug
title: 'Open in new tab opens the edit channel: the operator gets outline markers
  on a deliberately non-functional page'
created_by: EPIC-19
created_at: '2026-09-20T23:15:06.775879+00:00'
updated_at: '2026-09-20T23:41:34.002060+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: medium
  priority: medium
  auto_merge_back: true
  needs_review: false
  story_points: 1
  chat_comment: comment-552601b3
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