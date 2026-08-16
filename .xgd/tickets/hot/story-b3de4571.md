---
uid: story-b3de4571
id: STORY-107
type: story
title: Author a site's settings, components, page metadata and generated images through
  the control surface
created_by: xgd
created_at: '2026-08-10T09:32:44.463811+00:00'
updated_at: '2026-08-16T01:57:36.575120+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-e59210c5
  capability_uid: capability-2d32662d
  story_kind: feature
  story_points: 3
  uat_coverage: pass
---

## Story

**As a** site owner working through the builder's assistant, **I want** the parts of my site that are not its page elements — its settings, the working components on its pages, how each page describes itself to a search engine, and drawings composed for me — to be changeable through the same conversation and the same command line, **so that** a real site can be built and maintained end to end without anyone hand-editing its files.

## Description

The element tree is only part of a site. This story covers the four things that sit outside it and, until now, could not be reached at all:

**Settings.** The site's settings are written as a structured value naming the group to write in — a colour palette with its families and steps, a theme's typography and spacing, a navigation list and its entries. Writing merges at every depth: two objects merge, a list or a scalar replaces. That rule is what makes an object-valued write safe rather than dangerous — changing one colour in a palette does not require resending the palette, and a family left unnamed is not silently deleted. Omitting the group writes at the top level, so a single scalar setting stays reachable without a second operation. Nothing new is validated: the site's own schema already described these shapes; what was missing was a value that could carry them.

**Components.** The working parts of a page — a contact form, a carousel — are instantiated from a closed catalog of vetted behaviours. The catalog can be listed with what each behaviour must be configured with and what its settings accept; an instance can be added, reconfigured and removed; and a page reports the instances already on it with their configuration. An instance's configuration is checked against that behaviour's own contract before the site validator runs, so a form with nowhere to send its enquiries is refused at the field rather than discovered at render. Supplying a presentation is optional: where a behaviour carries a vetted default look, that look is laid out from the instance's own configuration, so a form asked for with three fields arrives with three fields. What arrives is ordinary page content, refined afterwards through the element-tree write path.

**Page metadata.** A page carries search metadata on creation and on update, merged so improving a description does not clear the title, and it reaches the rendered document.

**Generated images.** A drawing composed by the assistant can be written into the site as an image — a mark, an icon, a divider, a diagram. It becomes an ordinary entry in the site's image list, referenced from a picture element like any other, and ships into the render unaltered. Because it is the one image in a site that no person vouched for, it is a separate grantable capability from managing files a person supplied, and its contents are checked rather than trusted: accepted whole or refused whole, never rewritten.

**Out of scope.** Authoring a new *kind* of component — the catalog is closed, and a new behaviour is written, reviewed and vetted by a developer. Extending the element vocabulary itself. Uploading any file, including licensed binary fonts, which remain the font-registry-and-provenance capability's work.

## Technical Context

- Builds on the declared control surface (item 6 of this bundle) for its declaration, grant, error taxonomy, provenance marking and per-call audit, and on element-tree authoring (item 7) for refining what a component instantiation produces. All operations here go through the same single write path as the command line and the operator's click-to-edit modal — none gains a way past validation, atomicity or re-render.
- **A new security boundary opens here.** Until a model could author the bytes, an asset was a file a person placed on their own machine and an extension check was the whole question. A generated SVG is an XML document the browser executes, served same-origin from the site's own assets and legitimately referenced — so the renderer's URL-scheme allowlist (DOC-2) neither applies nor helps. The validator is closed by construction rather than by blocklist: every byte must be accounted for by a token the grammar names, with no skip-what-we-do-not-recognise branch, so a construct nobody anticipated is a refusal rather than a pass. Element and attribute allowlists, local `url(#id)` references only, no stylesheet or `style` attribute, no document type declaration or entity declaration, only the five XML entities, and byte and element caps mirroring the element envelope's own.
- **Naming note (no behavioural divergence).** The intent and the surface declare the component operations as `add_component` / `configure_component` / `remove_component` / `list_behaviors`; the command line and the underlying write path name the same operations `module add|set|rm` and `behavior list`. One set of behaviours, two vocabularies at two boundaries.
- **Flagged for a future reconciliation, not claimed here.** The "a behaviour declares a default presentation retrievable by its id" index lives in the framework's L2 layer, whose owning capability is the behaviour-module contract (CAP-70 / story-179b8c06). It is documented here because that is where the behaviour is observable — a component arrives with a working look in one call — but a later reconciliation of that capability may want an L2-side criterion of its own.
- Known upstream gaps this story does not claim closed: none specific to it; the enum-control, single-field-layout and refusal-rendering gaps recorded in this bundle are filed against other capabilities.

## Dependencies

- Item 6 — the site's control surface, declared as a governed API (story-93905de4)
- Item 7 — authoring the element tree through the control surface (story-189fc1ac)

## Story Points

3