---
uid: doc-976cde0e
id: DOC-28
type: doc
title: The Page Editor — direct manipulation on the live preview
created_by: xgd
created_at: '2026-07-31T01:03:15.038551+00:00'
updated_at: '2026-07-31T01:03:15.038551+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: architecture
---

# The Page Editor — direct manipulation on the live preview

## 1. Purpose

The page editor is the builder's **Design view**: the user edits a site's copy and
images **on the page itself** — hover a region, click it, edit it in a modal, see
it re-render. This document specifies that surface.

It is the detail companion to [[DOC-8]] (builder app architecture), which owns the
app around it: topology, preview rendering, the pipeline, validation, chrome. Read
[[DOC-8]] §4–§7 first; this document assumes them.

**Why it exists as its own document:** the editor is where a hard product
constraint (non-technical users must never meet the implementation) meets a hard
architectural constraint (every edit is a validated structured diff). Getting the
two to coexist is the whole design, and it has enough surface — hooks, hotspots,
modals, editor semantics per field type — to deserve its own home.

---

## 2. The user this is for

Our users are **non-technical**. Editing copy and images was always the product's
fundamental promise; the original plan put it in an asset-manager tab, which is
clunky. Direct on-page editing is a **more usable framing of the same intent**, not
a new feature.

The design consequence: *"I want to edit that piece of text right there on the
webpage, so I want to click on it and change it."* Every decision below serves
that sentence.

---

## 3. The exposure rule

**The user sees copy, asset selection, and friendly parameters. Nothing else.**

| Exposed | Never exposed |
|---|---|
| copy (the words) | L1 axes, dials, token names, module `config` keys |
| which image goes here | anything requiring knowledge of the framework |
| friendly parameters — *a colour picker*, a size, a basic image adjustment | the value the picker actually writes |

The user picks a background colour; they never learn that a token exists or what it
is called. **Anything sophisticated is done by the AI**, in chat. The editor is
deliberately shallow: it is the fast path for the two things a site owner changes
constantly, and an escalation to the AI for everything else.

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

## 5. The edit bridge — how a clicked pixel becomes a field

### 5.1 The problem

Rendered HTML carries no link back to the definition that produced it. Before
CHAT-9 M1, a rendered module carried only Astro's `data-astro-cid-*` scoping
hashes — nothing tying a `<section>` back to its instance id. Without such a link
there is no bridge from *"the pixel the user clicked"* to *"the field to change"*.
This is the load-bearing piece of the whole editor.

### 5.2 The behavior-module hook (landed — CHAT-9 M1)

Every behavior-module instance renders with an edit hook on its **root element**:

```html
<section data-fc-module="gallery"      data-fc-type="carousel">…</section>
<section data-fc-module="get-in-touch" data-fc-type="contact-form">…</section>
```

Contract:

- **Keyed by the stable instance `id`, not the type** — two instances of the same
  module on a page stay distinct edit targets.
- **One hook per instance, on the module's own root tag.**
- **Stamped once, centrally**, in the render loop
  (`tools/generate/src/render/render.ts` → `stampEditHook`) — not per component, so
  it covers the whole catalog with no per-module churn.
- **Inert.** Plain `data-*` metadata: no effect on layout, and harmless on the
  published site.
- **Resolution is one call:** a click anywhere inside a block resolves to its
  instance via `closest('[data-fc-module]')`.

Tests: `test_UAT_FC_CHAT-9_*` in `tests/chat9-edit-hooks.test.ts`.

### 5.3 The L1 gap (open — blocks the copy editor on real pages)

**The hook addresses behavior-module instances only, and since the framework pivot
that is no longer where most copy lives.** A page body is now either an L1 document
([[DOC-23]], REQ-88) or a module stack, and increasingly both — modules mount into
`slot`s inside an L1 page (REQ-93). Copy on a reproduced or authored page lives in
**L1 `text` nodes** (`{kind:'text', text: …}`) and images in **L1 `image` nodes**
(`src`/`alt`), neither of which the M1 hook reaches.

L1 nodes *do* have an optional `id`, but it is not an edit hook — REQ-106 gives it
a different job: it becomes a real DOM `id` so `href="#how"` resolves and so a
`control`'s `for`↔`id` association wires up. It is optional, sparse, and
user-visible in URLs; overloading it as the editor's addressing scheme would couple
two unrelated concerns.

So the editor needs an **L1-node addressing scheme** — a stable, dense way to name
the node a rendered element came from. Options, unresolved:

- a **structural path** from the document root (no schema change; brittle under
  reordering, which is exactly what edits do);
- a **synthesized per-node edit id** emitted by the L1 renderer alongside
  `id` (dense and stable, costs bytes on every element — possibly draft-channel
  only, since [[DOC-8]] §4.1 renders draft and published separately);
- a **minted persistent id** on editable L1 nodes in the definition itself
  (stable across re-render and reorder; a schema change and a burden on every
  author, human or AI).

This is the first thing to settle before M3. Until it is settled, the copy editor
can only reach copy inside behavior-module slots.

---

## 6. Interaction model

### 6.1 View / Edit toggle

Two modes, one toggle in the toolbar:

- **View** — the iframe behaves exactly as the published page would. Links work,
  behaviours run, nothing is decorated. This is what the site *is*.
- **Edit** — editable regions are made evident on hover (outline or overlay), and
  clicking one opens its editor modal.

The toggle exists because a builder that is permanently in edit mode is a builder
you cannot use to *look at* your site.

### 6.2 A modal editor — explicitly not WYSIWYG

Click a highlighted region → **a modal opens** → edit in a form → save. There is
**no inline HTML editing, no contenteditable surface, no WYSIWYG**. The modal is a
form over structured fields; that is precisely what makes §4 hold, and it is what
keeps the framework out of the user's face.

### 6.3 The overlay is computed over the preview document

Hit-testing and outlining happen against the same-origin iframe's DOM
([[DOC-8]] §4.2). The overlay logic should be written as **pure functions over a
document** — resolve element → target, compute the outline rect — so it is testable
in jsdom, with the live glue (listeners, mode state, modal launch) as a thin layer
on top.

---

## 7. Hotspot granularity

**What counts as one clickable region?** Two answers, and they are a genuine
product choice, not a technical one:

- **Block granularity (v1):** the whole section is one hotspot; clicking it opens a
  modal listing *all of that block's* copy fields together. Needs only block-level
  addressing, is less fiddly to build, and arguably reads better — all the copy for
  a section in one place.
- **Field granularity (later):** each run is its own hotspot; click the heading, get
  a modal for the heading.

v1 is block granularity. Field-level precision is additive and does not change the
edit vocabulary — only the hotspot map. Both are "click → modal editor"; nothing
about §6.2 changes either way.

---

## 8. The editors

### 8.1 Copy editor

A **generic form over the block's copy fields** — read the structured content and
render an input per text field. Because content is introspectable, this needs no
per-module editor code.

Styled text is a block-tree with inline runs ([[DOC-22]]). For v1, honour the
framing *"a tool for editing copy, not formatting"*:

- **edit the run text**, preserving structure and styling;
- expose **block-level** properties as friendly parameters (background colour, text
  colour, size, family, weight) — via a colour picker and simple choosers, never a
  token name;
- **per-run in-text restyling stays with the AI.** Getting there properly means a
  semantic rich-text engine (ProseMirror / TipTap / Lexical) in which the user never
  sees notation — a real piece of work, and the one place [[DOC-8]] §9 allows a
  React island inside a modal. Not day one.

### 8.2 Image editor and asset selection

Clicking an image block opens an asset picker plus basic adjustments. Everything is
**non-destructive and structured** — parameters the renderer applies, never a newly
baked file:

| Control | Structured field |
|---|---|
| choose a different image | `asset-ref` / the L1 `image` node's `src` |
| crop | crop rect (x / y / w / h) |
| scale | fit / scale field |
| translucent overlay (**scrim** — the right word; already first-class in the capture model, [[DOC-13]] §4) | `overlay {color, opacity}` |
| rotation, edge effects (circle → radius, soft → radial mask, torn → pre-torn asset), free positioning | L1 axes |

Non-destructive matters for two reasons: it keeps edits round-trippable and
undoable like every other structured edit, and it keeps the asset store clean —
one uploaded asset, many framings, rather than a new blob per crop.

The **Asset tab** is the same asset store surfaced as a tab; the image editor
invokes it as a modal picker. That shared surface is also how the two tabs may
eventually collapse into one screen ([[DOC-8]] §3.2).

---

## 9. The toolbar

Above the preview, in no fixed order:

| Control | Behaviour |
|---|---|
| **Site selector** | choose which site's draft the iframe shows |
| **Edit / View toggle** | §6.1 |
| **Open in new tab** | the *same* draft render URL the iframe loads ([[DOC-8]] §4.3) — an iframe can distort layout, so a real tab is the honest view |
| **Publish** | snapshot the draft into a new immutable revision and render it live — a thin call over [[DOC-12]] §5's existing `publish` machinery |

---

## 10. The edit loop

```
click region → resolve to structured target (§5)
  → modal form over that target's exposed fields (§3, §8)
  → save → structured diff
  → validate (the shared validator — [[DOC-8]] §7 layer 1)
       ├─ invalid: surface the error, revert; nothing is applied
       └─ valid:   apply to the draft definition
  → re-render the draft (server-side — [[DOC-8]] §4.1)
  → refresh the iframe
```

Two properties worth naming: the loop is **the same one the AI drives** (only the
first two steps differ), and the re-render is **server-side**, so what the user sees
after an edit is the same artifact the published site would be.

---

## 11. Milestones

Tracked under CHAT-9.

| | Scope | Status |
|---|---|---|
| **M1** | Render edit hooks — `data-fc-module` / `data-fc-type` per instance (§5.2) | **done**, tested, landed |
| **M2** | Builder panel — shell → Design tab; toolbar (site selector · Edit/View · open in new tab); iframe of the served draft render; edit mode outlines blocks | next |
| **M3** | Copy editor — click block → modal of its copy fields → validated structured edit → re-render → refresh | blocked on §5.3 for L1 pages |
| **M4** | Asset selector + image editor (§8.2) | after M3 |

M2 needs a decision on how the builder is served locally and how `webui-*` is
consumed ([[DOC-8]] §13 Q1) — neither is an editor-design question.

---

## 12. Open Questions

1. **L1 node addressing (§5.3)** — the blocking one. Structural path, synthesized
   render-time edit id, or minted persistent id?
2. **Does the hook ship on the published channel?** It is inert and harmless, but
   draft and published render separately ([[DOC-8]] §4.1), so draft-only is
   available and would keep published bytes minimal. Decide together with (1),
   since a dense per-node id makes the byte cost real.
3. **Hotspot granularity beyond v1 (§7)** — when, and driven by what evidence?
4. **Nested hotspots** — a text node inside a module slot inside an L1 box has
   several plausible targets. Innermost-wins, or a way to step out to the parent?
5. **Rich-text editing (§8.1)** — which engine, and when does per-run styling stop
   being AI-only?
6. **Non-destructive image params vs the capture/fold model** — the repro pipeline
   already folds crops and scrims into L1; the editor should write the *same*
   fields rather than a parallel vocabulary. Confirm they are identical.
7. **Undo affordance in the editor** — does the modal have Cancel only, or does the
   Design view expose the diff-log undo directly?

---

## 13. Related Tickets

- [[DOC-8]] — builder UI architecture (the app around this editor)
- [[DOC-2]] — security policy (the structured-only boundary §4 preserves)
- [[DOC-12]] — storage, versioning, publish (what the toolbar's Publish does)
- [[DOC-13]] — reference capture model (scrim / overlay as first-class)
- [[DOC-22]] — styled text content model (what the copy editor edits)
- [[DOC-23]] — L1 substrate (where copy now lives — §5.3)
- [[DOC-25]] — behavior modules (what M1's hook currently addresses)
- CHAT-9 — the design discussion and the M1–M4 milestones
