---
uid: capability-b4ac88fc
id: CAP-89
type: capability
title: 'Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette'
created_by: xgd
created_at: '2026-08-07T15:26:37.596731+00:00'
updated_at: '2026-08-07T18:17:12.877414+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  name: site-materials-and-start-point
---

# Capability: Site Materials & Starting Point

**What a site is made of, and what it starts as — the materials a site definition
draws on and the governance attached to them, held apart from the framework that
renders those materials and from the surfaces that edit them.**

This capability answers four questions that all sit *beneath* editing and *beside*
the framework substrate: what does a site begin life as, what can it reference,
where did those referenced bytes come from, and what colours does it actually
contain. Each was previously its own capability; they are consolidated here
because they share one subject — the site's own material inventory — and none
carries enough independent evidence to stand alone.

## Scope

### The authoring start point
What a newly created site *is*, before anyone edits it: a complete layout document
— width ladder, document background, a laid-out root and one visible run — that
validates, renders and screenshots immediately, on the same width ladder a
reproduction keyframes at, in colours the page's own document declares. One shape, no mode
selection and no second starter form; and a reproduction import replaces the page
document wholesale, so a scaffolded skeleton cannot leak into a reproduced site.

### The site asset store
One answer to *"what can this site reference"*, shared by every caller that needs
it — the operator at the command line, the builder origin, and any editing surface
that must offer a closed choice of assets. The listing is the union of the two
sources that disagree in practice: the declared registry inside the site definition
(metadata, no bytes) and the site's draft asset directory (bytes, no metadata),
merged by handle and reported with provenance, so an undeclared file is visible as
an undeclared file and a declared asset with no file is visible as a missing one.

### Asset provenance & licence compliance
Where a byte came from and what its licence permits — a project-level index over
every asset file of a governed kind, recording origin, licence terms and the
separate permissions those terms grant, plus the gates that stop an unanswered
licence question from reaching a customer site. The load-bearing distinction is
between *"may we use this on a site we run ourselves"* and *"may we ship this
across ten thousand customer sites"*: the record carries a three-state answer to
the second question, and every gate treats the unresolved state as *no*.

### Site colour census & palette retrofit
Measuring an existing site definition's colours and migrating it onto the palette
colour model without moving a pixel: the census (distinct literals with use counts,
distinct RGB ignoring alpha, alpha families) in human- and machine-readable form;
palette derivation by exact alpha collapse then hue-family ramp grouping, with
role-vocabulary renaming from the command line; and the lossless-or-refuse write
that proves every derived reference reproduces the literal it replaces and that the
converted definition still validates, or writes nothing.

## Out of scope

- The layout language, the value system and the palette colour *model* itself —
  owned by the framework substrate capability.
- Binding an asset handle to its served substance (pixels reaching a page) — also
  the framework substrate.
- The reproduction pipeline, and everything an author does *after* the first render.
- Deploying or publicly serving a site — owned by the site delivery capability.