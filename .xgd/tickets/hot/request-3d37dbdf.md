---
uid: request-3d37dbdf
id: REQ-313
type: request
title: 'The assistant cannot obtain a font: use_font, and the knowledge that says
  it cannot'
created_by: EPIC-21
created_at: '2026-09-23T03:19:21.329714+00:00'
updated_at: '2026-09-23T03:19:21.329714+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-526b326e
---

## The gap

**The production assistant cannot obtain a font at all.** Not "does not know where to find
one" — it has no hands.

`tools/generate/src/cli/ai/instances.json` defines the two production instances,
`consultant` and `builder`. Both carry `ReadSite` (which holds `list_assets` and
`get_asset`) and `AuthorPages`. **Neither carries `ManageAssets`**, the group holding
`add_asset` / `remove_asset`. And `add_asset` would not help if granted —
`toolbox-core.ts:262` notes it "reads a file off the operator's disk", making it
structurally a dev-machine tool.

So the assistant can see fonts already on a site and can paint a `fontFamily`, but its only
route to a *new* font is asking the customer to go download one and drop it in the
conversation. Otherwise it paints a family name that silently resolves to the browser
default — `REF-l1.md:604` states exactly this:

> A painted font family must resolve to a face the page serves or name a generic every
> browser has, or it silently paints the browser default rather than anything chosen.

[[REQ-312]] puts 1,941 families on a platform origin. Without this ticket the assistant
still cannot reach one of them.

## Wanted

### 1. `use_font`

One new operation, in a group the production instances actually carry.

`use_font(family, weights?, styles?)`:

- **Binds the face** into the page's `l1.resources.fonts` with a platform-origin `src`, and
  returns the handle to write into `axes.fontFamily`.
- **Refuses legibly** when the family is not in the mirror, naming it, so the model picks
  another rather than silently painting a generic. A refusal is a correction, not an error
  — it is the normal outcome of naming a font we do not carry.
- **Reports which weights and axes actually ship.** Asking for weight 300 of a family that
  ships 400/700 is answered with what exists rather than accepted and silently fallen back
  on. This is the same class of fact as "the file exists".
- Is **idempotent** — binding a family already bound rebinds nothing and does not duplicate
  the resource entry.

No search operation. The catalogue lives in the system KB as [[DOC-56]] and is reached
through the knowledge path the assistant already uses for every other design question; a
bespoke font search would be a second retrieval stack to keep correct.

### 2. The knowledge that currently contradicts it

Two places teach the assistant that a font is something it must be given. Left in place
they will stop it reaching for the tool, which is the failure mode where the feature ships
and goes unused.

- **`l1-surface.json:1242`** — *"You cannot go and get a file — not from a URL, not from a
  machine, not from anywhere… so when you need a photograph, a logo **or a font**, ASK FOR
  IT HERE."* The font clause comes out. The sentence stays true for photographs and logos,
  which the assistant still cannot fetch.
- **`REF-l1.md:604`** — still true as a statement about rendering, but must no longer read
  as "so do not choose a font". It gains the resolution: a family bound with `use_font`
  *is* served.

`REF-l1` is a projection, so the change is made at its source.

### 3. The distinction the assistant must hold

A platform font and a client-uploaded font are both usable and are **not the same thing**.
The first is cleared by construction; the second was attested by the client and is their
responsibility. The assistant should not tell a client that a font they uploaded is
"licensed" — only that they said so.

## Behaviour

- Asking for a mirrored family binds it and the page renders in that face rather than a
  fallback.
- Asking for a family not in the mirror is refused by name, and the refusal is legible
  enough to choose again from.
- Asking for a weight a family does not ship returns the weights it does ship.
- Binding the same family twice leaves one resource entry.
- A page whose fonts were bound by `use_font` passes `1c fonts check`.
- The assistant no longer asks a client to supply a font that is in the mirror.

## Dependency

[[REQ-312]] — `use_font` writes a platform-origin `src`, so the mirror and its serving
origin must exist first.