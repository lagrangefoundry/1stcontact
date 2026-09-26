---
uid: request-129b5b14
id: REQ-327
type: request
title: Zoomable images — let a visitor open a picture large
created_by: xgd
created_at: '2026-09-25T23:28:56.882077+00:00'
updated_at: '2026-09-26T06:54:30.926692+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f717659b
  commits:
  - working_sha: 28e6aa2cc984e509ba5318cf77262893ef87080e
    reconcile_sha: null
    main_sha: null
  - working_sha: 316ddeb5a0ba1a8532c91c5b0062267af03beb26
    reconcile_sha: null
    main_sha: null
  version: 0.2.369
---

## What I was trying to achieve

Let a visitor click or tap an image on the page and see it **large** — filling the viewport, on a dimmed ground, dismissed by clicking away or pressing Escape.

The case: a site whose argument is carried by four detailed illustrated plates. At their placed width the fine detail — including lettering that is part of the artwork's meaning — is unreadable. The images are the most memorable thing on the page and a visitor currently cannot actually look at any of them.

## What stopped me

There is no way to make an image interactive beyond wrapping it in a link to another page, and no component in the catalogue does this. A link to a standalone page showing the image is a poor substitute: it navigates away, loses scroll position, and turns looking closely into leaving.

## What would let me finish

Either would do:

**A — a field on the picture element.** Something like `zoomable: true`, with the platform supplying the overlay, the dismiss affordances and the focus handling. Cheapest for an author and impossible to get wrong. Worth including an optional larger source, so the zoomed view can use a higher-resolution original than the placed one.

**B — a lightbox component.** Takes a set of images with captions, supplies the overlay and (optionally) next/previous between them. More capable — it gives a gallery — but needs mounting and configuring where A is one field.

I would start with A. Most uses are one image opened on its own, and B can arrive later for genuine galleries.

## Things to settle either way

- Dismiss on click-outside and on Escape.
- Focus moves into the overlay and returns to the trigger on close; the page behind does not scroll while it is open.
- The cursor should indicate the image is openable — otherwise nobody discovers it.
- Which source is shown: placed width is often too small, so the zoomed view should use the original asset rather than a rendered variant.

---

## What was built — option A, the `zoom` role on the picture element

An `image` node may carry **`zoom`**, a new node-level role beside `link`:

```json
{ "kind": "image", "src": "/assets/plate-1.png", "alt": "Plate 1 — the ladder",
  "zoom": {} }
```

`zoom: {}` is the whole of the common case — the picture opens itself large, and
every obligation below is supplied by the platform. The role's four fields are
all optional and each exists for a case the empty form cannot state:

- **`src`** — a higher-resolution original to show large, when the placed asset
  is not the best copy the site holds. Absent → the placed node's own `src`.
- **`alt`** — what the large picture shows, when it is not what the placed one
  shows (a plate whose detail is the point). Absent → the node's own `alt`.
- **`backdrop`** — the scrim the page behind is dimmed with, as a colour at an
  opacity (the same shape the modal's own backdrop takes). Absent → the
  renderer's dim, because a zoom with no ground is not a zoom: unlike a modal,
  the absence cannot mean "no scrim".
- **`ariaLabel`** — an accessible name for the overlay. Absent → the picture's
  alt text.

### It is the existing modal, not a second overlay implementation

The obligations this ticket lists — dismiss on click-away, dismiss on Escape,
focus into the overlay and back to the trigger on close, no scrolling behind —
are exactly the ones REQ-212's overlay role already owns, and none of them are
re-implemented here. A zoomable picture compiles to the modal machinery that is
already vetted: the same shell class and open/lock/ready markers, the same
per-panel scrim and placement rules, the same one shared script. What is new is
that the renderer **synthesizes** the pair a document would otherwise have to
author by hand — a trigger, and a panel holding the large picture — from one
field on the picture itself. No new script ships, and the script still carries no
instance data.

Consequences that follow from reusing it, rather than from a second decision:

- The page fails **visible**. Every overlay rule is gated on the marker only the
  script sets, so a page whose script never runs shows the large picture in flow,
  open and usable, rather than hiding it behind a gesture nothing can perform.
- The zoom panel is a panel the page declares, so a channel switch in the builder
  carries an open zoom across it exactly as it carries an authored panel's.
- The edit channel keeps the element, the class and the box and loses only the
  attributes that would ACT — a click there means "edit this picture", as it does
  for a link and for a disclosure button.

### The trigger

A void element cannot be a button, so the picture is **wrapped** — the one
existing exception the substrate already makes for a linked image, taken for the
same reason. The wrapper generates no box (`display: contents`), so the picture
participates in its parent's layout exactly as the bare `<img>` did, and every
geometry, sizing and paint rule still lands on the picture's own selector.

A real `<button>` rather than a picture with a click handler: the keyboard has to
reach it. Enter and Space open the overlay because the element is a button, not
because a script was taught two more keys.

**The cursor says it is openable** (`zoom-in`, inherited through the boxless
wrapper onto the picture), and the overlay's own cursor says how to leave it
(`zoom-out`, and gated on the ready marker so an unenhanced page does not claim
a gesture it cannot honour). Because the wrapper paints no box, a focus ring on
it would paint nothing — so the ring is drawn on the picture inside it, and a
keyboard visitor can see where they are.

### The large picture

Shown from the **original asset** and never from a delivery rendition: the zoom
image carries `src` alone, with no `srcset` and no `sizes`, because the whole
purpose of opening it is the detail a rendered-down variant has already thrown
away. It does take its intrinsic `width`/`height` from the publish manifest when
there is one, so the overlay reserves the right box before the bytes arrive, and
it is fetched lazily so a page of plates does not pay for four originals up
front.

It is sized to fit what covers the viewport, and clicking it closes — the
overlay dismisses on a click anywhere, which is the forgiving reading of
"dismissed by clicking away" for a panel that holds one picture and nothing
interactive.

### What the vocabulary refuses

- `zoom` is carried by `image` and by nothing else. A box has no replaced content
  to open, and `.strict()` refuses the field on every other kind by shape.
- A picture cannot carry both `link` and `zoom`: one element cannot both navigate
  away and open on this page, and which won would be a property of the renderer
  rather than of the document — the rule `action` and `link` already answer to.
- `zoom.src` clears the same URL allowlist as `image.src`, and names an asset the
  site actually holds — a zoom that opens onto a broken image is worse than no
  zoom, because the visitor has already committed a click to it.
- An email page carrying a zoomable picture is refused by name, beside `dialog`
  and `action`: a zoom is a script, and a message has no script.

### Not included

No operator-facing toggle in the builder's image panel. A boolean there would
have to mean "delete the role" when unset, which silently discards a `zoom.src`
an author chose — the lossy-write case the field contract already refuses to
offer. The AI authors the role; the operator surface is a separate decision.

## Test plan

`tests/test_UAT_FC_REQ-327_zoomable_images.test.ts` — the two boundaries every
other L1 capability is proved at (the envelope validator and the sole emitter),
plus the published page driven end to end in jsdom, which is where the
dismissals, the focus move and the scroll lock are observable at all.

- the vocabulary: `zoom` on an image is accepted; on every other kind refused;
  `link` + `zoom` on one node refused; an unsafe `zoom.src` refused; a
  `zoom.src` the site does not hold reported as dangling
- the trigger: a `<button>` wrapping the picture, generating no box, carrying the
  disclosure ARIA and the open marker; the zoom-in cursor; the focus ring on the
  picture inside the wrapper
- the panel: the dialog role, its modality, its name, the scrim from the
  document or the renderer's dim; the large picture from the original asset with
  no `srcset`, its intrinsic dimensions, lazily fetched
- driven: opening by click and by keyboard, Escape, a click on the scrim, a click
  on the picture itself, focus into the overlay and back to the trigger, the
  scroll lock on and off
- reuse: a page with a zoom ships REQ-212's script once and no second one; the
  edit render ships no script and no acting attribute
- the email target refuses it by name