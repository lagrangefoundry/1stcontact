---
uid: request-a115da4d
id: REQ-106
type: request
title: 'L1 cannot express a link: typed link role + DOM id emission'
created_by: xgd
created_at: '2026-07-27T22:57:19.236802+00:00'
updated_at: '2026-08-05T19:32:19.584562+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: f083baaf96685e77d2006ee47e310d7879b88143
    reconcile_sha: null
    main_sha: null
  version: 0.0.218
  bundled_in: bundle-ee56a66e
---

## The gap

**L1 cannot express a link.** Verified:

- `grep href|anchor` over `packages/site-schema/src/l1/schema.ts` → nothing.
- The renderer's node switch handles `text`, `control`, `image`, `slot`, `box`,
  `container`. There is no anchor kind.
- `grep -c '<a '` over `packages/framework/src/l1/render.ts` → **0**.

So an L1 page has no navigation of any kind. On xgd.dev (REQ-95) that means
"Join the beta waitlist", "Read the whitepaper", all three nav items and the
footer are inert; the page's only interactive element is a capture form, which is
itself broken (BUG-28).

This is a functional floor, not an aesthetic ceiling. Unlike REQ-103 (texture) it
cannot be worked around, deferred, or compensated for with design.

It is an L1 gap by the CLAUDE.md test: navigation is presentation plus a URL, not
a behaviour with its own core. A behavior module for "being a link" would be
absurd, and `fold` maps captured node axes onto L1 nodes — a captured `<a>` has
nowhere to go today.

## Shape — a wrapper role, not a node kind

A link is not a *kind* of thing, it is a *role* any subtree can take: a text run,
a painted box containing a run, a whole card, an image. So it follows
`l1TransformSchema` / `l1InteractionSchema` and becomes a node-level field rather
than a seventh kind.

```ts
export const l1LinkSchema = z.object({
  href: z.string(),
  newTab: z.boolean().optional(),
  ariaLabel: z.string().optional(),
}).strict()
```

**The renderer retags rather than wraps.** Where the node already emits a single
element (`text` → `<p>`, `box`/`container` → `<div>`), that element becomes an
`<a>` and keeps its class verbatim. This matters: wrapping would put focus on an
outer element while `interaction.hover`/`focus` (REQ-99) target the inner class,
so a linked node would lose its focus ring — the one axis DOC-24 says taste may
not override. `image` is the exception: a void element cannot be an anchor, so it
wraps.

`control` is deliberately excluded — a submit button inside an anchor is a
malformed interactive nesting, and the module owns that element's semantics.

The renderer owns the safety attributes, as it owns every other sink:
- `href` clears the existing `isSafeUrl` allowlist — the same check that guards
  `image.src` and `backgroundImageUrl`, so `javascript:` is rejected with no new
  security surface. An unsafe href degrades to the un-linked element.
- `newTab` emits `target="_blank" rel="noopener noreferrer"`. There is no way to
  ask for `_blank` without the `rel`.
- `text-decoration: none` and `color: inherit` are pushed BEFORE the node's axes,
  so a link paints from L1 rather than from UA chrome, and an authored
  `textDecoration` still wins.

## In-page anchors need real DOM ids

`href: "#how"` requires the target to have that id. Most L1 nodes already carry an
optional `id`, but the renderer never emits it. It must — and because duplicate
DOM ids break both anchors and the `for`↔`id` association the `control` contract
depends on, the L1 envelope validator must reject a document with two nodes
sharing an id. REQ-95's own page has such a pair (the `visibility`-paired hero CTA
duplicates, the REQ-104 workaround), which is exactly how the rule earns its keep.

## Acceptance criteria

1. A `text`, `box` or `container` node with `link.href` renders as an `<a>`
   carrying that href, with its class and every paint axis unchanged.
2. An `image` with `link.href` renders wrapped in an `<a>`.
3. `newTab: true` emits `target="_blank"` **and** `rel="noopener noreferrer"`.
4. A `javascript:` (or otherwise unsafe) href renders the element with no anchor
   and no href — never a live unsafe link.
5. `interaction.focus.ring` still applies to a linked node (the focus indicator
   survives the retag).
6. A node's `id` is emitted as a DOM id, and `#anchor` navigation works.
7. The envelope validator rejects a document with duplicate node ids.
8. `control` nodes reject `link` at validation.
9. Every existing L1 page renders unchanged when no node declares `link`.
10. xgd.dev's nav, both hero CTAs and the footer navigate.