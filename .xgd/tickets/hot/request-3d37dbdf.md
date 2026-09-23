---
uid: request-3d37dbdf
id: REQ-313
type: request
title: 'The assistant cannot obtain a font: use_font, and the knowledge that says
  it cannot'
created_by: EPIC-21
created_at: '2026-09-23T03:19:21.329714+00:00'
updated_at: '2026-09-23T20:28:03.718443+00:00'
completed_at: null
last_field_updated: body
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

[[REQ-312]] puts 1,935 families on a platform origin. Without this ticket the assistant
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

**And the distinction is enforced, not only taught.** A page already serving a family from
its own `draft/assets/` is serving the tenant's bytes under the tenant's attestation.
`use_font` must not quietly repoint that family at the platform mirror — the two faces are
different bytes under different obligations, and a silent swap would change what a client
is serving without anyone deciding to. Naming such a family is refused, saying which
tier already holds it.

## Behaviour

- Asking for a mirrored family binds it and the page renders in that face rather than a
  fallback.
- Asking for a family not in the mirror is refused by name, and the refusal is legible
  enough to choose again from.
- Asking for a weight a family does not ship returns the weights it does ship.
- Binding the same family twice leaves one resource entry.
- A page whose fonts were bound by `use_font` passes `1c fonts check`.
- The assistant no longer asks a client to supply a font that is in the mirror.
- A family the page already serves from its own assets is refused rather than repointed.
- On a deployment whose mirror was never populated, `use_font` says so plainly rather than
  reporting every family as unknown.

## How it is built

The decisions below are consequences of the four bullets above rather than separate
requirements, and are recorded because the UATs test them.

### The `src` is site-relative

`use_font` writes `/_fonts/<slug>/<file>.woff2` — the path [[REQ-312]] reserved, not an
absolute URL. `public-site` answers `/_fonts/…` ahead of the site grammar on **every** host
it serves, so one spelling reaches the mirror from a local preview, a staging deployment,
a `1stcontact.io` site and a bound customer domain alike. An absolute URL would pin a
hostname into every page that binds a font and make a site's conformance a property of
which deployment last wrote it — the thing `parsePlatformFontSrc` deliberately avoids by
matching on path and never on host. Same-origin also removes the CORS question entirely.

### One resource entry per weight and style

`l1FontFaceSchema` carries a single optional `weight` and `style` per entry, and the
renderer emits `font-weight` only when `weight` is set — so a face bound with no weight
matches 400 alone and every other weight is synthesised. A variable family therefore binds
the same file once per requested weight, each entry carrying its own `weight`; the browser
pins the `wght` axis from the `@font-face` descriptor. A static family binds the matching
release file per weight and style. One rule for both, and no change to the renderer.

Defaults, when the call names none: the weights the family ships intersected with
{400, 700} — falling back to its nearest shipped weight to 400 when it ships neither — and
`normal` alone. The result reports the whole of what the family ships, which is how the
assistant learns what else it can ask for.

### The assistant's oracle is a projection of the mirror

`fonts/platform.json` is the mirror's manifest: every family, path, size and two digests
per file. It is megabytes of provenance the assistant has no use for, and the assistant
runs in a Worker with no filesystem, so the manifest cannot be read at call time and
should not be bundled whole.

`1c fonts index` projects it — joined to `fonts/catalogue.json` for the category each
family belongs to — into `tools/generate/src/cli/ai/platform-fonts.json`: family, slug,
category, licence, the faces with their paths, and the variable axes. The toolbox imports
it as data, for the reason `l1-surface.json` is imported as data (REQ-146): a Worker has no
`readFileSync` and no module path.

`1c fonts check` verifies the projection is current whenever the manifest exists, so an
index left behind by a refreshed mirror is a reported violation rather than an assistant
binding paths that 404.

### What comes back

The result carries the family handle, a ready-to-paint `fontFamily` stack ending in the
generic its category implies (`"Playfair Display, serif"`), the faces now bound, and
everything the family ships. The stack is returned rather than the bare name because a
stack with a generic in it cannot silently paint the browser default — which is the whole
failure `REF-l1.md:604` names.

### Where it sits

`use_font` joins **`AuthorPages`**. It is a page write in the same sense `set_page_style`
is, both production instances already carry that group, and a group of its own would be a
grant to add in two places. `ManageAssets` stays ungranted — nothing here gives the
assistant a way to read a file off anybody's disk.

The write goes through `editDocumentSet`, the same single write path `set_page_style` uses,
so validation, atomicity and the change log are the ones the site already has.

## Dependency

[[REQ-312]] — `use_font` writes a platform-origin `src`, so the mirror and its serving
origin must exist first. **Landed** (`f62cf1b0f7`).
