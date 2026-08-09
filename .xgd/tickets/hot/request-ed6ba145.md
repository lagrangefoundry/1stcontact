---
uid: request-ed6ba145
id: REQ-130
type: request
title: 'Beyond L1: structured config, module instantiation, page metadata and generated
  assets'
created_by: xgd
created_at: '2026-08-09T23:24:24.532382+00:00'
updated_at: '2026-08-09T23:24:24.532382+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

# Beyond L1: structured config, module instantiation, page metadata and generated assets

REQ-129 closes the L1 half of authoring. This closes the rest — everything a real site carries
that is *not* the element tree — so that "rebuild the actual site through the chat" becomes a
checkable end state rather than a slogan.

Sequenced after **REQ-129** (`get_l1` / `set_l1`). Licensed binary fonts are **REQ-101**'s
(font registry + provenance) and are deliberately excluded here.

## Why

Take `storage/sites/xgd/` as the target — the real site, not a site of similar quality. Its L1
needs nothing new: the 122-node tree is already valid against today's schema, loads through
`validateSite` and renders. Today's L1 vocabulary expresses the actual site completely, and
REQ-129 makes it writable.

What remains is all outside L1:

| what | where | why unreachable today |
|---|---|---|
| `palette` (6 families with steps), `theme` (6 sub-objects) | `site.json` | `set_config`'s `value` is typed `string` |
| `contact-form` instance, on both pages | `page.modules` | no declared operation touches `modules` |
| `seoMeta` (title, description) | per page | `add_page` / `update_page` take only `page`/`title`/`path` |
| 4 generated `.svg` files | `draft/assets/` | `add_asset` takes a **file path**; nothing writes bytes |

The same `set_config` string limit is what stopped the assistant adding nav entries in the
conversation that produced this ticket. It is one defect with several faces.

## Behaviour

### 1. Structured config

`set_config` accepts a **typed value**, not only a string — so a palette family, a theme group or
a `nav` entry list can be written whole. The schema already describes every one of these
(`navEntrySchema`, `navConfigSchema`, the palette and theme shapes in `site-schema`), so
validation is `validateOrThrow` unchanged; what is missing is a parameter type that can carry an
object.

Reads already work: `describe_site` returns the whole base (`config`, `theme`, `nav`, `assets`,
`palette`), so the model can see what it is amending before it writes.

### 2. Module instantiation

Add, configure and remove **instances** of vetted behavior modules on a page — `page.modules`
entries of the form `{id, type, version, slot, config}` — bound into an L1 slot.

This is squarely inside the sandbox and is what DOC-25 §10 describes: *"the AI configures a
behavior module; it never writes its code inline."* Authoring a new module TYPE is development
with a vetting bar (DOC-26) and is **not in scope**. The operation offers only types the framework
already publishes, and `config` is validated against that module's declared schema.

### 3. Page metadata

`add_page` / `update_page` accept `seoMeta`. Small, but it is page-level content the operator
cares about and nothing else can write it.

### 4. Generated assets

Write a **generated text asset** — an SVG the assistant composed — into the site's assets.

This is the one genuinely new kind of capability here, and it is the one with a security cost.
It is NOT a general file write: see below.

## ⚠️ Security: generated SVG is the risk in this ticket

`IMAGE_EXTENSIONS` already accepts `svg`, and the renderer's `isSafeUrl` guards URL **schemes** at
every sink. Nothing sanitises SVG **contents**, and today that is sound — an asset is a file an
operator placed on their own machine, so a human vouched for it.

The moment a model can author the bytes, unsanitised SVG is a stored-XSS vector: `<script>`,
`onload=` and friends, `<foreignObject>`, external `xlink:href`. The URL-scheme allowlist does not
help — the file is same-origin and legitimately referenced.

So this capability ships only with:

- a **content** validator for SVG (element/attribute allowlist; no script, no event handlers, no
  foreign objects, no external references), not merely an extension check;
- a size cap and a node-count cap, as L1 already has;
- a generated, validated filename — no caller-supplied path, no traversal, no overwrite of an
  existing asset without an explicit force;
- text formats only. Binary uploads stay out; a model cannot produce a `.woff2` and should not be
  handed a channel that looks as though it could.

If the SVG validator cannot be made convincingly closed, this capability is dropped from the
ticket and the other three ship without it. It is the only part here that widens the attack
surface rather than the expressive one.

## ⚠️ The operator's editor must not break

As REQ-129: `editCopyGet` / `editCopySet` / `copyFieldsOf` are the click-to-edit modal's contract
(REQ-117 / REQ-118 / DOC-28 §4) over `/api/copy`, and also back `1c copy get|set`. Untouched.

Additionally: a page carrying an AI-instantiated module must still behave in the modal exactly as
a hand-authored one does — module slots are L1 subtrees (DOC-25 §1), and `pageSegments` already
walks them, so copy inside an AI-added contact form must remain clickable and editable.

## Acceptance

Named pieces of the actual xgd.dev, rebuilt through the chat:

1. the XGD palette (warm bone + petrol teal) and theme, written as structured config;
2. the `signup` contact-form instance bound into the `signup-form` slot, on both pages;
3. both pages' `seoMeta`;
4. the wireframe mark as a generated SVG asset, referenced from an L1 image node — and rejected
   when the same operation is handed an SVG carrying a script or an event handler.

With REQ-129, that leaves only the two licensed font families (REQ-101) between the chat and the
real site.

## Not in scope

- **Authoring new behavior module types** — development, with DOC-26's vetting bar.
- **Extending L1** — the sandbox's expressive ceiling is raised by developers adding typed
  primitives (CLAUDE.md), never by the production tool.
- **Binary asset upload**, including fonts — REQ-101.
