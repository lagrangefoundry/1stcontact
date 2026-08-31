---
uid: doc-976cde0e
id: DOC-28
type: doc
title: The Page Editor — direct manipulation on the live preview
created_by: xgd
created_at: '2026-07-31T01:03:15.038551+00:00'
updated_at: '2026-08-31T19:43:15.554754+00:00'
completed_at: null
last_field_updated: system_kb
status: null
fields:
  doc_kind: architecture
---

# The Page Editor — direct manipulation on the live preview

## 1. Purpose

The page editor is the builder's **site view** (the `site` tab — its label is a
configuration value, default `"Site"`, [[DOC-8]] §3.1): the user edits a site's copy and
images **on the page itself** — hover a region, click it, edit it in a modal, see
it re-render. This document specifies that surface.

It is the detail companion to [[DOC-8]] (builder app architecture), which owns the
app around it: topology, preview rendering, the pipeline, validation, chrome. Read
[[DOC-8]] §4–§7 first; this document assumes them.

**Why it exists as its own document:** the editor is where a hard product
constraint (non-technical users must never meet the implementation) meets a hard
architectural constraint (every edit is a validated structured diff). Getting the
two to coexist is the whole design.

---

## 2. The user this is for

Our users are **non-technical**. Editing copy and images was always the product's
fundamental promise; the original plan put it in an asset-manager tab, which is
clunky. Direct on-page editing is a **more usable framing of the same intent**, not
a new feature.

The design consequence: *"I want to edit that piece of text right there on the
webpage, so I want to click on it and change it."* Every decision below serves
that sentence.

**The AI remains the primary mode of interaction and the only way a page is
created.** The editor exists because routing every comma, typo and font-size nudge
through a conversation is painful — not because direct manipulation is the better
authoring model. It is the fast path for small tweaks, and an escalation to the AI
for everything else.

---

## 3. The exposure rule

**The user sees copy, asset selection, and friendly parameters. Nothing else.**

| Exposed | Never exposed |
|---|---|
| copy (the words) | L1 axes, dials, token names, module `config` keys |
| which image goes here | anything requiring knowledge of the framework |
| friendly parameters — *a colour picker*, a size, a basic image adjustment | the value the picker actually writes |

The user picks a background colour; they never learn that a token exists or what it
is called. **Anything sophisticated is done by the AI.**

This is a *product* rule with an architectural payoff: because the exposed surface
is small and hand-picked, every control can be a known-safe structured edit (§4).

---

## 4. The invariant: a second producer, not a second path

Every edit the page editor makes is a **structured, validated diff — the same edit
vocabulary the AI emits, through the same validator**. The editor and the chat AI
are peers, not two mechanisms ([[DOC-8]] §5.2).

The concrete test, applied to every proposed control:

> **Could the AI have produced this exact edit through its tool surface?**
> If no, it does not ship as a control — it goes to the AI.

No editor writes raw HTML or CSS. No editor has a "raw" mode. This is what let
[[DOC-8]] withdraw its ban on click-to-edit without weakening the security boundary
([[DOC-2]], [[DOC-7]] §6.2).

---

## 5. Edit mode is a *render*, not an overlay

This is the load-bearing architectural decision, and it is what makes everything
else cheap.

### 5.1 A third render channel

[[DOC-8]] §4.1 has two render channels (published, draft preview). Edit mode is a
**third**: the same L1 document and the same renderer, rendered *differently*.

| Channel | Renders | For |
|---|---|---|
| published | at publish, build time | the public site |
| draft preview | on request | View mode in the iframe; "open in new tab" |
| **edit** | on request | **Edit mode in the iframe** |

In the edit render, **the page deliberately does not work**:

- **links have no target** — clicking a link edits its copy, it does not navigate;
- **forms have no action** and behaviour scripts are not emitted — nothing submits,
  nothing fetches;
- **no motion** — see §5.3;
- **segment handles are stamped** on every editable node (§5.2);
- **segment outlines are drawn by the renderer**, which knows each segment's box,
  rather than hit-tested and computed by the client.

### 5.2 The edit bridge — how a clicked pixel becomes a field

Rendered HTML carries no link back to the definition that produced it. A
`<p class="l1-12">` does not say where it came from. Bridging that gap is the whole
problem, and the edit render solves it almost for free: **the renderer is walking
the L1 tree, so it already knows which node it is emitting.** It stamps the address
as it goes.

Two address spaces, because content has two homes:

| Content lives in | Address | Status |
|---|---|---|
| a behavior-module instance | `data-fc-module="<instance id>"` + `data-fc-type` on the module root | **landed** — CHAT-9 M1 |
| an L1 node | a structural path from the document root, stamped in the edit render only | to build |

The L1 address is a **path of child indices** (the renderer's own walk), resolvable
by walking the same indices in the definition. Content inside a module slot is
reached the same way, rooted at the instance rather than the document.

**The address is render-scoped, not persistent.** It only has to stay valid for the
lifetime of the one rendered document the client is displaying. Every edit
re-renders, which regenerates the addresses. This is why the classic objection —
*"a structural path breaks when nodes are reordered"* — does not apply: reordering
produces a new render, and the client always resolves against the render in front
of it. Consequences:

- **no schema change** — L1 nodes need no new field;
- **no author burden** — nothing for the AI or a human to maintain;
- **no persistent identity to keep in sync** — because none is needed.

**L1's existing `id` is deliberately not used for this.** REQ-106 gave it a
different job: it becomes the real DOM `id`, so `href="#how"` resolves and a
`control`'s `for`↔`id` association wires up. It is optional and sparse (34 of 128
elements on `xgd/home`), and it is user-visible in URLs — so overloading it would
both fail to address most nodes and make the editor's needs dictate anchor names.

**Handles cost nothing on real pages.** They exist only in the edit render;
published and draft-preview bytes are untouched.

### 5.3 No motion; content renders in its settled state

The edit render emits no motion script, and — critically — **emits content in its
final, settled state, not its initial one**. Some pages fade text in on scroll;
simply dropping the script would leave that copy invisible and its segment
unclickable, which is worse than the animation.

The same principle generalises: **the edit render shows all content
simultaneously**, because nothing is interactive to reveal it. A carousel is the
worked example — its slides are all present in the DOM (a scroll track, not
`display:none`), so their copy is reachable, but with behaviour disabled they sit
scrolled out of view and are awkward to click. The edit render lets the track stack
so every slide is visible at once.

Preserving animation in edit mode is rejected for phase 1: untriggered reveals hide
segments, motion competes with the outline/highlight signal that edit mode depends
on, and a segment mid-transition has no stable box to outline.

---

## 6. The segment model

### 6.1 What a segment is

In edit mode the page **segments into a series of nested regions** — the logical
divisions that have user-editable controls. Regions with nothing editable are not
outlined at all, so the outlines themselves tell the user what is available.

Note the vocabulary trap: since the pivot, a **module** means a *behavioural*
widget (carousel, contact-form). A "hero" is not a module — it is an L1 box that
happens to look like one. L1 is a low-level tree of boxes within boxes with no
notion of "section", so the segment map must be **derived** from the tree.

### 6.2 Segments are derived, not declared

**Decision: derive.** A node becomes a segment by what it *is*, not by an
annotation:

| L1 node | Segment kind | Controls |
|---|---|---|
| `text` | copy segment | the words (phase 1); text properties (phase 2) |
| `image` | image segment | which image, basic framing (phase 1) |
| `box`/`container` carrying paint (background, fill, border…) | container segment | background colour/image, default text parameters (phase 2) |
| behavior-module instance | module segment | its `config` — e.g. the response email body (phase 2) |

Declared segmentation — the AI marking nodes as editable when it authors a page —
was considered and rejected for now: it is a schema change, it burdens every
author, and any page the AI forgets to annotate is silently uneditable. Derivation
needs none of that. **Revisit if the derived map does not match what users
perceive as sections** (§6.4).

### 6.3 What derivation actually produces

Measured on `storage/sites/xgd/draft/pages/home.json`:

| | count |
|---|---|
| copy segments | 62 |
| container segments | 10 |
| module slots | 1 |
| **total** | **73**, nested 2–5 deep |

This is the shape the design assumes: container segments with copy segments inside
them.

### 6.4 Known weakness

The container rule ("a box carrying paint") may land on a *wrapper* rather than the
section a user means. This is the specific thing to watch, and the trigger for
reconsidering declared segmentation.

### 6.5 Nesting and occlusion — measured, and deferred

Nested segments mean a click can land in several at once; innermost-wins is the
default. The problem case is an inner segment that fully occludes its parent,
leaving nothing to click for the outer one.

**Measured: 1 of 10 container segments on `xgd/home` wraps a lone text run** — the
only occlusion-prone shape. Rare enough that phase 1 needs no mechanism. If it
bites, the fix is a UI treatment rather than a model change: **shift-hover
separates overlapping segments** (a small shift/resize) so the user can pick the
one they want.

---

## 7. Interaction model

### 7.1 Edit is a *mode of the display panel*

The editor does not own the left pane. The pane is a **multi-mode display panel**
([[DOC-8]] §3.2) and edit is one of its modes, a peer of view:

- **View** — the draft preview render. The page behaves exactly as published:
  links work, behaviours run, nothing is decorated.
- **Edit** — the edit render (§5). Segments are faintly outlined; hovering a
  segment strengthens its outline with a small movement; clicking opens its editor.

Switching between them swaps the iframe's source; it does not rebuild the pane.
Other modes (template chooser, asset browser, revision diff) are peers again — so
the editor must not assume it is the only thing that can occupy the pane, and the
toolbar must not assume an iframe is always beneath it.

The toggle exists because a builder permanently in edit mode is a builder you
cannot use to *look at* your site.

### 7.2 A modal editor — explicitly not WYSIWYG

Click a segment → **a modal opens** → edit in a form → save. There is **no inline
HTML editing, no contenteditable surface, no WYSIWYG**. The modal is a form over
structured fields; that is what makes §4 hold and what keeps the framework out of
the user's face.

Where a segment has both copy and parameters, the modal is **two-stage**: a
parameters area and a text area. In phase 1 only the text stage exists, so the
modal is single-stage; phase 2 adds the parameters stage.

### 7.3 Structure is not editable

**In v1 there is no way to change page structure** from the editor — no adding,
removing, reordering, resizing or repositioning segments. Structure is the AI's
job. This is a deliberate scope wall, not a temporary gap (§8, phase 3).

---

## 8. Phases

Ordered by how much better direct manipulation is than conversation for that task.

### Phase 1 — copy and image selection

The two things that are far easier interactively than by describing them in prose,
and the two things a site owner changes constantly.

- **Copy editing** — click a copy segment, edit the words in a plain form field.
- **Image selection** — click an image segment, choose a different asset.

### Phase 2 — properties

- **Text properties** — size, colour, weight, family, and the container's
  background colour; exposed as friendly controls (a colour picker), never as token
  names.

  **A colour here is a value in the *site* definition — not shell theming.** The
  shell's tokens and themes style the *builder's own chrome*; setting a theme
  changes what the builder looks like, not what the customer's site looks like.
  The two never meet. What the editor needs is a **colour-valued field control**,
  a peer of the text and number controls — raised upstream as `xgd-framework`
  REQ-55 ([[DOC-8]] §9.4.1).

  **Settled: colours are picked from the site's palette, not individually.**
  Picking colours one at a time produces incoherent sites; the palette entry is the
  unit of change, and editing a colour means editing an entry and having every use
  follow. The palette is of arbitrary size. The model is [[DOC-23]] §5 (literal
  base, palette overlay); the implementation and the retrofit of existing sites are
  **REQ-114**.

  For the editor this means two distinct surfaces, and REQ-55's two control shapes
  map onto them exactly:

  | Surface | Control | Exposure |
  |---|---|---|
  | pick a colour for a segment | `enum` + `format: 'color'` — swatches of the site's palette | the friendly, primary path |
  | edit the palette itself | `string` + `format: 'color'` — free hex entry | a distinct, deliberate act, not reachable by accident from a segment |

  Free colour entry is therefore **not** removed — it is relocated to where it
  belongs. "My brand colour is exactly this hex" is a palette edit, not a segment
  edit.
- **Simple module properties** — a behavior module's `config`, e.g. the body of the
  response email for email capture. This lands cleanly on existing rails:
  [[DOC-25]] defines `config` as data-only and never aesthetic, which is exactly
  what an email body is.

### Phase 3 — structure (may never happen)

Explicit resizing, positioning, adding and removing segments. Recorded so the scope
wall in §7.3 is understood as a decision with a possible future, not an oversight.

---

## 9. The editors

### 9.1 Copy editor (phase 1)

A **plain form field per copy field** in the segment. Because content is
introspectable, this needs no per-segment editor code.

**Built on `webui-fields`, not hand-rolled** ([[DOC-8]] §9.3). `mountFields` is a
schema-driven property panel — descriptors + values in, typed controls, per-field
validation, and a settled confirm/cancel gesture model out. So the editor's job is
to **derive a field descriptor list from a segment** and hand confirmed values to
the structured-edit validator; it does not build forms. Use `buffered` commit so
the modal's Save is the flush point and one modal produces one structured diff.

Styled text is a block-tree with inline runs ([[DOC-22]]). Phase 1 honours the
framing *"a tool for editing copy, not formatting"*: edit the run text, preserve
structure and styling. **Per-run in-text restyling stays with the AI.** Doing it
properly means a semantic rich-text engine (ProseMirror / TipTap / Lexical) in
which the user never sees notation — real work, and the one place [[DOC-8]] §9
allows a React island inside a modal. Not day one.

**On copy that no longer fits.** L1 pins a run's width and can pin it to
`nowrapFromPx` so it will not wrap; vertical position is flow-based, so longer copy
generally pushes content down rather than overlapping, but a no-wrap headline can
run out of its box. **This is accepted:** the goal is to let the user enter the text
they want; if the result looks ugly they work with the AI to tidy it. One mitigation
is free and required — because the modal edits the text in a plain form field, **the
full string is always legible there** regardless of what the render does to it. Ugly
is acceptable; *silently clipped so the user cannot see what they typed* is not.

### 9.2 Image editor and asset selection

Phase 1 is **selection**: click an image segment, pick a different asset. Framing
controls follow. Everything is **non-destructive and structured** — parameters the
renderer applies, never a newly baked file:

| Control | Structured field |
|---|---|
| choose a different image | the L1 `image` node's `src` / an `asset-ref` |
| crop | crop rect (x / y / w / h) |
| scale | fit / scale field |
| translucent overlay (**scrim** — already first-class in the capture model, [[DOC-13]] §4) | `overlay {color, opacity}` |
| rotation, edge effects (circle → radius, soft → radial mask, torn → pre-torn asset), free positioning | L1 axes |

Non-destructive matters twice: edits stay round-trippable and undoable like every
other structured edit, and the asset store stays clean — one uploaded asset, many
framings, rather than a new blob per crop.

The **Asset tab** is the same asset store surfaced as a tab; the image editor
invokes it as a modal picker. That shared surface is also how the two tabs may
eventually collapse into one screen ([[DOC-8]] §3.2).

---

## 10. The toolbar

Above the preview, in no fixed order:

| Control | Behaviour |
|---|---|
| **Site selector** | choose which site's draft the iframe shows |
| **Edit / View toggle** | swaps render channel (§5.1, §7.1) |
| **Open in new tab** | the *same* draft render URL the iframe loads ([[DOC-8]] §4.3) — an iframe can distort layout, so a real tab is the honest view |
| **Publish** | snapshot the draft into a new immutable revision and render it live — a thin call over [[DOC-12]] §5's existing `publish` machinery |

---

## 11. The edit loop

```
click segment → resolve to its structured target via the stamped address (§5.2)
  → modal form over that segment's exposed fields (§3, §9)
  → save → structured diff
  → validate (the shared validator — [[DOC-8]] §7 layer 1)
       ├─ invalid: surface the error, revert; nothing is applied
       └─ valid:   apply to the draft definition
  → re-render (edit channel) → refresh the iframe
```

Two properties worth naming: this is **the same loop the AI drives** — only the
first two steps differ — and the re-render is **server-side**, so what the user sees
is produced by the same renderer that produces the published site.

---

## 12. Implementation plan

Five tickets deliver phase 1 — **REQ-115 … REQ-119**, with `depends_on` wired to
match the graph below. CHAT-9 remains the discussion home.

**Landed already:** module edit hooks — `data-fc-module` / `data-fc-type` per
instance (§5.2), CHAT-9 M1, tested.

```
T1 builder shell ──┬─────────────── T3 copy editing ── T4 image selection ── T5 deploy
                   │                      │
T2 edit render ────┴──────────────────────┘
```

| | Ticket | Delivers | Depends on |
|---|---|---|---|
| **T1** — REQ-115 | **Builder shell** | The consumption decision for `@gendevlabs/webui-*` ([[DOC-8]] §9.5) and the wiring; the shell inside `control-app` with the **`site` tab**; `split` (panel \| chat placeholder); the **multi-mode display panel** and its mode contract ([[DOC-8]] §3.2); the **mode-aware** toolbar (site selector · View/Edit toggle · open-in-new-tab · Publish); persistence via `shell.storage`. View mode shows the **already-rendered** draft served statically, so this lands with no new render work. **The tab label is a single configuration value (default `"Site"`)** — id `site` is stable, the label is never a repeated literal ([[DOC-8]] §3.1). | — |
| **T2** — REQ-116 | **The edit render** | The third render channel ([[DOC-8]] §4.1) complete: links/forms/behaviour/motion off with content in its **settled state** and all content shown at once (§5.1, §5.3); **derived segmentation** (§6); **L1 address stamping** — render-scoped structural paths (§5.2); renderer-drawn outlines. Renderer-side, no UI — testable on rendered output alone. | — (parallel with T1) |
| **T3** — REQ-117 | **Copy editing — the first end-to-end edit** | The whole loop (§11): click segment → derive field descriptors → `mountFields` modal in **buffered** commit so Save is the flush and one modal is one diff ([[DOC-8]] §9.3) → shared validator (layer 1, [[DOC-8]] §7) → apply to the draft → re-render → refresh. Includes the structured-edit write path, which has no value without a consumer and no correctness without the validator. | T1, T2 |
| **T4** — REQ-118 | **Image selection** | Click image segment → asset picker → `asset-ref` / `src` edit, reusing T3's loop. Framing controls (crop / scale / scrim, §9.2) follow once Q5 is closed. | T3 |
| **T5** — REQ-119 | **Deploy it for real** | Replace T1's static serving with **request-time draft and edit renders inside `control-app`** via the Astro Cloudflare adapter ([[DOC-8]] §4.1). Deliberately last — it changes *where* the render runs, not *what* it produces, so everything above is built and proven before the runtime moves. | T3 (contingent on [[DOC-8]] §13 Q3) |

### Notes on sequencing

- **T1 and T2 are independent** and can run in parallel — one is chrome, the other
  is renderer. T3 is where they meet, and it is the first ticket that produces a
  visible edit.
- **T1's real content is a decision**, not code ([[DOC-8]] §13 Q1). Everything
  waits on it.
- **T1 deliberately avoids the render question.** Pointing the iframe at the
  already-rendered draft on disk gets a real page on screen immediately; T5 swaps
  the source without touching the panel.
- **T5 presumes an answer to §13 Q3** (does v1 run against the file-backed store
  locally first?). If v1 stays local, T5 is deferred rather than dropped — phase 1
  is functionally complete at T4.

### Not in phase 1

The **chat pane** (`webui-chat` + `webui-markdown` + `webui-scroll`, with the card
registry as the seam for rendering AI edits) and **phase 2 properties** (text and
background colour from the site palette, module `config`, and the palette-editor
surface — gated on **REQ-114** and `xgd-framework` **REQ-55**) are follow-on work,
deliberately unticketed until phase 1 is real.

---

## 13. Open Questions

1. **Does derived segmentation match perception?** Specifically the container rule
   landing on wrappers (§6.4). Judge it on a real page in M3, not in the abstract.
2. **Address encoding** — the exact form of the L1 structural path, and how a path
   into a module slot is written (§5.2).
3. **Nested-segment separation** — build shift-hover only if occlusion actually
   bites (§6.5).
4. **Rich-text editing (§9.1)** — which engine, and when does per-run styling stop
   being AI-only?
5. **Image params vs the capture/fold model** — the repro pipeline already folds
   crops and scrims into L1; the editor must write the *same* fields, not a
   parallel vocabulary. Confirm they are identical before building §9.2.
6. **Undo affordance** — does the modal have Cancel only, or does the site view
   expose the diff-log undo directly?
7. **The palette editor** — phase 2 needs a surface for editing the palette itself
   (§8), which is a *site-level* tool, not a segment editor. Is it another display
   panel mode ([[DOC-8]] §3.2), a modal, or its own tab? Depends on REQ-114 for the
   data model and `xgd-framework` REQ-55 for the control.

---

## 14. Related Tickets

- [[DOC-8]] — builder UI architecture (the app around this editor)
- [[DOC-2]] — security policy (the structured-only boundary §4 preserves)
- [[DOC-12]] — storage, versioning, publish (what the toolbar's Publish does)
- [[DOC-13]] — reference capture model (scrim / overlay as first-class)
- [[DOC-22]] — styled text content model (what the copy editor edits)
- [[DOC-23]] — L1 substrate (the tree segments are derived from)
- [[DOC-25]] — behavior modules (module segments and their `config`)
- CHAT-9 — the design discussion and the milestones