---
uid: request-ed6ba145
id: REQ-130
type: request
title: 'Beyond L1: structured config, module instantiation, page metadata and generated
  assets'
created_by: xgd
created_at: '2026-08-09T23:24:24.532382+00:00'
updated_at: '2026-08-10T11:00:52.948530+00:00'
completed_at: '2026-08-10T11:00:52.948530+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: e6ff11aabe1497c172ea0e8141c76fd36a8e0b6e
    reconcile_sha: null
    main_sha: null
  version: 0.1.34
  story_points: 8
  bundled_in: bundle-e59210c5
  chat_comment: comment-a3f23a36
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

## Behaviour — as built

### 1. Structured config

`set_config` takes `settings`, a typed **object**, and an optional `key` naming the group to
write in (omitted → the top level). The Toolbox's declared base types are
`string|integer|number|boolean|object|array` with no union, so an object-valued parameter was
the whole of the available design space — and that made the write semantics the real decision.

**It merges; it does not replace.** Two objects merge at every depth; a list or a scalar
replaces. Replace-at-key — what `editConfigSet` did before — is what would have made an
object-only parameter dangerous: changing one colour in a palette would mean resending the
whole palette, and any family omitted would be silently deleted, invisibly until someone
looked at the site. Merging also keeps single scalars reachable (`key: "config"`,
`settings: {businessName: …}`) without a second operation.

Nothing new is validated. `validateOrThrow` already runs `siteSchema` over the whole resulting
definition, and the palette, theme and nav shapes were always described there. The gap was
never the validator — it was that no parameter could carry the value.

Reads already worked: `describe_site` returns `config`, `theme`, `nav`, `assets`, `palette`, so
the model sees the group before amending it. A `sequences:` entry now says to.

The CLI keeps `1c config set <slug> <key> <value>` and JSON-parses the value, because argv is
the one place a setting genuinely arrives as text. That parse moved out of `edit.ts` into the
CLI (`parseConfigValue`), so no tool caller re-reads a string as syntax (DOC-20 S2).

### 2. Component instantiation

`add_component` / `configure_component` / `remove_component`, plus a read `list_behaviors`.
`describe_page` now also lists the instances already on a page with their config.

Two decisions worth recording:

- **`presentation` (the slots) is optional.** A `contact-form` requires a `form` slot holding a
  `control` node per field, which is a whole form's design — demanding it before the form
  exists would make instantiation a multi-turn negotiation. L2 already held that design
  (`l2/contact-form.ts`); what was missing was a way to ask for it *by behavior id*, so
  `l2/presets.ts` adds `presetSlots(behaviorId, config)`. Without it every caller creating an
  instance grows the same `if (type === 'contact-form')` — the literalism CLAUDE.md forbids.
  The result is ordinary L1, refined afterwards by `set_l1`.
- **`config` is validated against the behavior's own contract**, not just the site schema:
  `validateBehaviorInstance` runs before `validateOrThrow`. `validateSite` lives in
  `site-schema` and cannot see the framework's behavior metas, so without this a caller could
  write a form with no `action` and find out at render.

Authoring a new behavior **type** is not reachable and is declared as an absence. The catalog
is closed; a miss names what it holds.

### 3. Page metadata

`add_page` / `update_page` take `seo`. Merged, so improving a description does not clear the
title. Asserted through to the rendered `<title>` and `<meta name="description">`.

### 4. Generated assets

`write_image` writes an SVG the assistant composed. Its own capability group (`DrawImages`),
separate from `ManageAssets`, so it can be withheld: every other image in a site was chosen by
a person, and this is the one that was not.

## ⚠️ Security: generated SVG was the risk, and this is how it is closed

`IMAGE_EXTENSIONS` already accepts `svg`, and the renderer's `isSafeUrl` guards URL **schemes**
at every sink. Nothing sanitised SVG **contents**, and that was sound while an asset was a file
an operator placed on their own machine — a human vouched for the bytes.

Once a model authors them, unsanitised SVG is stored XSS: `<script>`, `onload=`,
`<foreignObject>`, external `xlink:href`. The URL-scheme allowlist does not help — the file is
same-origin and legitimately referenced.

The ticket said this ships with a convincingly-closed validator or is dropped. It ships.
`packages/site-schema/src/svg.ts`:

- **Closed by construction, not by blocklist.** The document is consumed by a strict scanner
  and *every byte must be accounted for* by a token the grammar names. There is no
  skip-what-we-do-not-recognise branch, so a construct nobody anticipated is a refusal rather
  than a pass. That property is what makes an allowlist worth having, and it is tested
  directly rather than by a sample of payloads.
- **Never rewritten.** Accepted whole or refused whole, like a site definition — not
  stripped-and-continued.
- Element and attribute allowlists; `url(#local)` only for reference attributes; no `style`
  (raw CSS is DOC-2's line); no DOCTYPE/ENTITY (XXE); only the five XML entities.
- 64 KiB and 2000-element caps, mirroring L1's envelope.
- **Generated filename**: one lowercase word → `<stem>.svg`. There is no path to traverse
  because there is no path. Conflict unless `replace`.
- **Text formats only.** A model cannot produce a `.woff2` and must not be handed a channel
  that looks as though it could. Fonts stay REQ-101's, with provenance attached.

Scanning uses sticky regexes over an index rather than per-character `slice()`; the naive form
is quadratic and the byte cap alone does not save it.

## ⚠️ The operator's editor must not break

As REQ-129: `editCopyGet` / `editCopySet` / `copyFieldsOf` are the click-to-edit modal's
contract (REQ-117 / REQ-118 / DOC-28 §4) over `/api/copy`, and also back `1c copy get|set`.
Untouched.

Additionally proven rather than assumed: copy inside a component the **assistant** instantiated
is addressable and editable in the modal, over the same `/api/copy` transport the browser uses.

## Acceptance — all four, evidenced

1. the XGD palette (warm bone + petrol teal, with steps) and theme written as structured
   config, and a second write that changes one family without losing the others;
2. a `signup` contact-form bound into the `signup-form` slot, validated against the behavior
   contract, rendering a real `<form action="/api/lead">` with an `email` control;
3. `seoMeta` written on add, merged on update, and present in the rendered HTML;
4. a wireframe mark written as SVG, referenced from an L1 image node, shipping unaltered into
   the render — and 15 hostile documents (script, event handlers, `foreignObject`, external
   `href`/`use`, stylesheet, `style` attribute, external paint reference, `<!ENTITY>`, numeric
   entities, CDATA, unquoted attribute, `<a href="javascript:">`, no `<svg>` root) each refused
   with no byte written.

With REQ-129, that leaves only the two licensed font families (REQ-101) between the chat and
the real site.

## Test plan

`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts` — 17 UATs across the four capabilities, the
declaration/implementation/grant correspondence, the declared absences, and the modal
invariant. Nothing mocks `edit.ts` or stubs the Toolbox.

`tests/test_UAT_FC_REQ-126_l1_surface.test.ts` updated: it enumerates the declared write set so
a new write cannot appear unnoticed. Four were added; that guardrail firing is it working.

Regression scope run green: REQ-122 (tool surface, chat host), REQ-126, REQ-127, REQ-129,
REQ-121, REQ-128, `generate`, `naming`, `public-site`, `chat9-edit-hooks`, `req85-conformance`,
`framework-*`.

## Not in scope

- **Authoring new behavior module types** — development, with DOC-26's vetting bar.
- **Extending L1** — the sandbox's expressive ceiling is raised by developers adding typed
  primitives (CLAUDE.md), never by the production tool.
- **Binary asset upload**, including fonts — REQ-101.