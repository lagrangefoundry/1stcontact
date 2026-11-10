---
uid: story-b3de4571
id: STORY-107
type: story
title: Author a site's settings, components, page metadata and generated images through
  the control surface
created_by: xgd
created_at: '2026-08-10T09:32:44.463811+00:00'
updated_at: '2026-11-10T00:53:38.710186+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-2d32662d
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by:
  - bundle-5607a08d
  - bundle-374f88d6
---

## Story

**As a** site owner working through the builder's assistant, **I want** the parts of my site that are not its page elements — its settings, the working components on its pages, how each page describes itself to a search engine, and drawings composed for me — to be changeable through the same conversation and the same command line, and a drawing made for me to appear in the conversation that made it, **so that** a real site can be built and maintained end to end without anyone hand-editing its files.

## Description

The element tree is only part of a site. This story covers the four things that sit outside it and, until now, could not be reached at all:

**Settings.** The site's settings are written as a structured value naming the group to write in — a colour palette and its named entries, a theme's typography and spacing, a navigation list and its entries. Writing merges at every depth: two objects merge, a list or a scalar replaces. That rule is what makes an object-valued write safe rather than dangerous — changing one colour in a palette does not require resending the palette, an entry left unnamed is not silently deleted, and naming one field inside the theme's typography leaves the rest of that group standing. Omitting the group writes at the top level, so a single scalar setting stays reachable without a second operation. Nothing new is validated: the site's own schema already described these shapes; what was missing was a value that could carry them.

**Components.** The working parts of a page — a contact form, a carousel — are instantiated from a closed catalog of vetted behaviours. The catalog can be listed with what each behaviour must be configured with and what its settings accept; an instance can be added, reconfigured and removed; and a page reports the instances already on it with their configuration. An instance's configuration is checked against that behaviour's own contract before the site validator runs, so a form with nowhere to send its enquiries is refused at the field rather than discovered at render. Supplying a presentation is optional: where a behaviour carries a vetted default look, that look is laid out from the instance's own configuration, so a form asked for with three fields arrives with three fields. What arrives is ordinary page content, refined afterwards through the element-tree write path — and, being ordinary page content, reached by the operator's click-to-edit modal like anything else on the page: the copy inside an instance the assistant created is addressable and editable there, over the same transport the browser already uses.

**Page metadata.** A page carries search metadata on creation and on update, merged so improving a description does not clear the title, and it reaches the rendered document.

**Generated images.** A drawing composed by the assistant can be written into the site as an image — a mark, an icon, a divider, a diagram. It becomes an ordinary entry in the site's image list, referenced from a picture element like any other, and ships into the render unaltered. Writing it stores bytes and nothing else — the site definition is untouched and the drawing carries no alt text of its own; what it shows is written on the picture element that places it. A name already in use is refused unless replacement is asked for. A drawing is for when a drawing is what was wanted: the operation's declaration tells the assistant it is never a stand-in for a file the client supplied — if that file cannot be found or used, the assistant says so and asks for it. Because it is the one image in a site that no person vouched for, it is a separate grantable capability from managing files a person supplied, and its contents are checked rather than trusted: accepted whole or refused whole, never rewritten.

**A drawing appears in the conversation that made it** (REQ-217). In a builder session, `write_image`'s result carries a `display` field: one ordinary markdown image line addressing the drawing where the builder's preview serves it, under the current business's own path (`/b/<businessId>/preview/<slug>/draft/assets/<file>`). The surface (version 9) tells the assistant to paste that line into its reply word for word, and names "showing a picture any way but pasting the line" as an absence. Since the picture is then part of the assistant's own turn, it comes back when the conversation is reloaded. In the chat pane, a picture in a message is bounded to the pane's width and a fixed maximum height. On a host with nowhere to show a picture (the `1c` CLI) the field is absent and the assistant describes the drawing in words. The line names the drawing as the site now holds it, so redrawing it with replacement changes what earlier turns show. A drawing has no Library entry, so clicking it in the conversation opens nothing.

**Out of scope.** Authoring a new *kind* of component — the catalog is closed, and a new behaviour is written, reviewed and vetted by a developer. Extending the element vocabulary itself. Uploading any file, including licensed binary fonts, which remain the font-registry-and-provenance capability's work. Making a picture in the conversation smaller on the wire (a thumbnail rendition) and letting the model see the picture, both excluded by REQ-217.

## Technical Context

- Builds on the declared control surface (item 6 of this bundle) for its declaration, grant, error taxonomy, provenance marking and per-call audit, and on element-tree authoring (item 7) for refining what a component instantiation produces. All operations here go through the same single write path as the command line and the operator's click-to-edit modal — none gains a way past validation, atomicity or re-render.
- **The modal's reach into an instance is claimed here, not borrowed.** The modal's own contract (`editCopyGet` / `editCopySet` / `copyFieldsOf` over `/api/copy`, REQ-117 / REQ-118) belongs to the click-to-edit capability and is untouched by this story. What this story claims is the consequence of its own "what arrives is ordinary page content": that a component *the assistant* instantiated is no less reachable than a hand-authored subtree, proven rather than assumed, because a module slot is an L1 subtree that the page's segment walk already enters.
- **A new security boundary opens here.** Until a model could author the bytes, an asset was a file a person placed on their own machine and an extension check was the whole question. A generated SVG is an XML document the browser executes, served same-origin from the site's own assets and legitimately referenced — so the renderer's URL-scheme allowlist (DOC-2) neither applies nor helps. The validator is closed by construction rather than by blocklist: every byte must be accounted for by a token the grammar names, with no skip-what-we-do-not-recognise branch, so a construct nobody anticipated is a refusal rather than a pass. Element and attribute allowlists, local `url(#id)` references only, no stylesheet or `style` attribute, no document type declaration or entity declaration, only the five XML entities, and byte and element caps mirroring the element envelope's own.
- **Display line (REQ-217, BUNDLE-44).** `HostDeps.assetUrl` (`(slug, handle) => string`) is an optional factory, bound to the session's slug in `host-core.ts` and threaded into `createL1Toolbox` beside `measurer`. It is absent by default and on the `1c` CLI. `router.ts` supplies it from `scope.businessId` via `scope.ts`'s new `businessPath()`, the inverse of `splitBusinessPrefix` (the two round-trip); a handle that is already absolute or has a scheme is passed through unchanged. The markdown is formed only by `displayLine(name, url)` in `toolbox-core.ts`, which `create_image` (STORY-172) shares, because the chat pane recovers a picture from its `<img src>` and two spellings would diverge. The URL is explicitly business-scoped because an unscoped `/preview/…` resolves to the first admissible business (`resolveScope` fallback), which for a multi-business operator would show another business's asset. The instruction prose is in `l1-surface.json` (`shapes.image.display`, `write_image`'s description, `absences`), `surface_version` 8 → 9. The pane rule is `.builder-chat img` in `builder.css`; it bounds content `webui-chat` never anticipated and does not restyle the component, so `builder.css`'s no-restyle comment does not apply. The chat's stock DOMPurify sanitiser already permits `<img>`; `webui-chat` and the replay path are unchanged.
- Evidence (REQ-217's free-coded suites, retargeted at reconciliation to the ACs they prove):
  - `tests/reconciliation-assistant-picture-in-the-turn.workers.test.ts` — `test_UAT_AC2569_a_drawing_the_turn_made_is_fetchable_from_the_turn`: a scripted turn through the Worker's route table over real D1/R2; the line is exactly `/b/<businessId>/preview/<slug>/draft/assets/wordmark.svg`, its prefix is split by the production `splitBusinessPrefix`, the bytes come back, and a `replace: true` redraw hands back the identical line that now serves the new drawing.
  - `tests/reconciliation-assistant-picture-in-the-turn.test.ts` — `test_UAT_AC2569_write_image_hands_back_a_business_scoped_line_that_a_redraw_keeps` (line shape, alt text stripping, round trip of the business prefix, redraw), `test_UAT_AC2570_surface_v9_tells_the_model_to_paste_the_line_word_for_word` (`surface_version` 9, the image shape's `display` text, `write_image`'s description, the named absence), `test_UAT_AC2571_with_no_asset_url_factory_the_drawing_is_written_with_no_display`, `test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane` (`max-width: 100%`, `max-height: 260px`, auto width and height).
  - `tests/reconciliation-assistant-conversation.test.ts` — `test_UAT_AC2570_a_turn_that_pasted_a_display_line_replays_it_after_a_restart` (the line is part of the stored assistant turn and comes back verbatim after a host restart).
  - `create_image`'s two cases from the same free-coded workers file were dropped as redundant with story-39c992d3's AC-2567 and AC-2568 UATs.
- **Naming note (no behavioural divergence).** The intent and the surface declare the component operations as `add_component` / `configure_component` / `remove_component` / `list_behaviors`; the command line and the underlying write path name the same operations `module add|set|rm` and `behavior list`. One set of behaviours, two vocabularies at two boundaries.
- **Flagged for a future reconciliation, not claimed here.** The "a behaviour declares a default presentation retrievable by its id" index lives in the framework's L2 layer, whose owning capability is the behaviour-module contract (CAP-70 / story-179b8c06). It is documented here because that is where the behaviour is observable — a component arrives with a working look in one call — but a later reconciliation of that capability may want an L2-side criterion of its own.
- Known upstream gaps this story does not claim closed: none specific to it; the enum-control, single-field-layout and refusal-rendering gaps recorded in this bundle are filed against other capabilities.
- **No registry (BUG-44, operator decision 2026-09-01).** A drawing used to be registered in the site definition's asset registry with an alt text; that registry was deleted (see STORY-102), so a drawing is an ordinary stored file and AC-1104/AC-1105 now speak of the stored definition being untouched rather than of a registry. The no-stand-in rule comes from BUG-45, where a client's uploaded logo was silently replaced by an assistant drawing; it is a declaration, asserted on the surface text — a mechanical gate on substitution is a larger design and is not claimed.

### Code issue flagged (not encoded as an AC)

- **The `1c` usage text still advertises `--alt` on `1c asset write`.** `tools/generate/src/cli/index.ts:438` reads `1c asset write <slug> <name> --content <svg> [--alt <t>] [--force]`. Since BUG-44 the `write` arm passes only `{ ...opts, force }` to `editAssetWrite`, which has no alt option, so `--alt` is accepted and silently ignored. An operator reading the help would expect the drawing to carry the alt text; it does not (AC-1109 asserts the written asset has no `alt`). Removing the `[--alt <t>]` fragment is a code change that needs a mode_override grant; it is recorded here rather than made during reconciliation (review report-e82f1d68 G2).

## Reconciliation Decisions

- **AC-1109 drops "optional alt text" from the command-line drawing write** (decided at reconciliation, 2026-10-30, review report-e82f1d68 G1). AC-1109 was authored before BUNDLE-32 and described the CLI writing a drawing "with optional alt text". BUG-44 behaviour 5 (bundle-5607a08d) retracted alt from `add_asset` / `write_image`; an image's alt text is the required `alt` on the L1 image node. The code follows it: the CLI `write` arm no longer reads `--alt`. AC-1109 is rewritten in place — the remaining three capabilities in that criterion are unchanged — to "writing a drawing by supplying its content, with explicit replacement", and its UAT no longer passes `--alt` and asserts the written asset carries no `alt`.
- **The display line's alt text is the file name without its extension and square brackets** (decided at reconciliation, 2026-11-09, BUNDLE-44). REQ-217 says only "the file's name and not a description". The code strips the extension and `[`/`]` so the alt cannot break the markdown. This is formalized in AC-2569. It is not the drawing's accessible description, which stays on the picture element (AC-1104).
- **The chat-pane height bound is 260px** (decided at reconciliation, 2026-11-09, BUNDLE-44). REQ-217 asks for "a `max-height`" without a value, so the code's 260px (with block display and auto sizing) is formalized in AC-2572 as the bound.
- **Reload survival is asserted through the transcript, not the panel's replay code** (decided at reconciliation, 2026-11-09, BUNDLE-44). REQ-217 says nothing in the replay path changes. AC-2570 therefore asserts that the line is part of the stored assistant turn and renders as an `<img>`, not any new replay behaviour.
- **A drawing in the conversation is not clickable** (REQ-217 "What landed", following BUG-84's operator decision that drawings stay site assets out of the Library). This is intent, not a gap. It is stated in AC-2569 so a later click-handler change does not read it as a regression.

## Dependencies

- Item 6 — the site's control surface, declared as a governed API (story-93905de4)
- Item 7 — authoring the element tree through the control surface (story-189fc1ac)

## Story Points

3