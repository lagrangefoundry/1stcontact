---
uid: doc-f79b5f4a
id: DOC-67
type: doc
title: 'Design note: the site design system as a first-class L1 object — bespoke per
  site, written by the principal, binding on every page'
created_by: EPIC-19
created_at: '2026-10-24T19:19:00.743529+00:00'
updated_at: '2026-10-24T19:38:32.813998+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  doc_kind: architecture
  parent_uid: epic-95bc3b15
---

# The site design system: a first-class L1 object

**Status:** design note, draft (2026-10-24). Raised in EPIC-19 from Dina's Diner's
first draft. To be agreed with the operator before any implementation ticket is
cut.

## 1. Why

Dina's Diner's first draft had a basic fault in almost every section (rendered
and measured 2026-10-24; screenshots at `/tmp/claude-501/dina/`):

- **Spacing all over the place.** No rhythm unit was set, so one unit fell back
  to the body line height (28px). Small-looking values of 3 and 4 became
  84–112px gaps. Headings had nothing above and 84–112px below, the reverse of
  proximity. Spacing on children of a box was silently dropped (0px between the
  hero's text and its buttons).
- **Sections at five different widths** (759, 761, 925, 1033 and 1232px). Sections
  have no default content width and shrink to their longest line inside the
  starter page's centred root.
- **No real headings.** Every "heading" was a text node with an inline 32px, so
  the site's `heading` style (Alfa Slab One) never applied.
- **Every photo the same:** full width, 350px tall, cover, centred. That cropped
  Dina's face at the top of the frame.
- **The hero photo (240px) beside a 296px text panel.**

The site **had** design objects: `palette`, `textStyles` (only `body` and
`heading`), and a generic `theme` (Tailwind-like spacing, container, radius and
shadow scales shipped unchanged to every site). They didn't prevent any of this,
for two reasons:

1. **Incomplete.** Two text styles cannot describe a page. `theme` is not a
   choice made for this site. Nothing describes content width, a grid, section
   spacing, components or imagery.
2. **Advisory.** Every node can type in its own values, and the builder did.
   Nothing used `theme`. A builder also changed a site-wide value (body line height
   to 28), which silently rescaled every gap on the site.

## 2. The pitch this must keep

We do not use templates. Every site is bespoke, and the only hard walls are
security and reliability, never taste (DOC-4). A library of section designs was
considered and **rejected**: it is templates by another name.

The design system is the opposite of a template. It is how an agency designer
stays bespoke **and** consistent: decide this site's own scales once, then build
every section from them. It is consistent within a site and different between
sites.

## 3. What it is: `site.design`

One typed, validated object per site, stored with the site definition and
versioned with it. It replaces `textStyles` and `theme`, absorbs `palette` roles,
and takes over the rhythm unit. A sketch (names to be settled):

- **`type`**: named roles: `display`, `h1`, `h2`, `h3`, `lead`, `body`, `small`,
  `caption`, `label`. Each has a family (a site font), weight, size and line
  height per width (keyframes, as L1 does today), letter spacing, and its own
  space above and below, so headings sit with what they introduce by
  construction.
- **`space`**: a named scale (`2xs` … `2xl`) in px per width, the **rhythm unit**
  stated in px, and two named relationships: `sectionGap` (between sections) and
  `blockGap` (between blocks in a section), with `sectionGap` > `blockGap`
  enforced.
- **`layout`**: `contentWidth` (and `wideWidth` / `bleed`), gutters per width, a
  column grid (count and gap per width), and the default alignment of a section
  to it.
- **`colour`**: roles (`background`, `surface`, `text`, `muted`, `accent`,
  `action`, `onAction`, …) that point to palette entries. Contrast between paired
  roles is validated.
- **`components`**: named treatments that recur on a site: `button.primary` /
  `button.secondary`, `card`, `quote`, `badge`. Each gives fill role, text role,
  padding, radius, border and shadow. A pull-quote and a review card are
  different components, not the same red box.
- **`imagery`**: the aspect ratios the site uses (for example hero 16:9, inline
  3:2, portrait 4:5), the corner radius, and that every crop uses the image's
  **focal point** (recorded by the describer when a photo is added).
- **`brand`**: the logo's visible height per width (measured on its painted ink,
  BUG-267) and the name's treatment.

Like all of L1 (security policy), it is typed values and closed enums only:
hex or palette refs, bounded numbers, no raw CSS. Where the system cannot express
something, the answer is a new typed field (DOC-7 §6.3).

## 4. Binding: nodes name the system

- **Nodes refer to the system by name:** `role: "h2"`, `space: "md"`,
  `width: "content"`, `component: "button.primary"`, `aspect: "inline"`.
- **The renderer applies the system by default:** a section takes `contentWidth`
  and the section/block gaps; text takes its role; an image takes its aspect and
  focal crop; a box's children are spaced by the system (no more silent drops).
- **A typed-in value is "off-system":** it is still allowed, so no taste is
  forbidden, but it is reported. `describe_page` lists off-system values per
  section, the layout check counts them, and the critic sees them. A section that
  is mostly off-system is a finding.
- **Changing the system changes every page.** That is the point: Dina's "make
  the headings bigger" is one edit, not forty.

## 5. Who writes it

- **The principal (the consultant) writes it, and builders consume it.** It is
  pure judgement (scale, air, measure, proportion), and the principal holds the
  brief, the agreed direction (REQ-432) and the comparison sites the client chose.
  Writing it is a few thousand tokens once per site (see "tokens are the scarce
  resource").
- **Builders cannot change it.** They build from it. A builder that finds it
  lacking (a missing component or role) says so in its report, and the principal
  decides. This closes the hole where a builder's site-wide line-height edit
  rescaled every gap.
- **The host seeds what can be measured:** the logo's visible size and aspect, each
  photo's dimensions and focal point, a palette drawn from the logo and photos.
  These are offered as a starting point. The principal chooses the rest.
- **The host validates what it wrote:** type sizes increase with role rank,
  `sectionGap` > `blockGap`, colour role pairs meet contrast, and content width is
  sensible per width. A design that fails is refused with the reason, like any L1.

## 6. When it is written, and how the client sees it

1. **Direction agreed** (the visual direction card, REQ-432).
2. **The principal writes the design system** before the first build. The first
   draft is built from it.
3. **"Colours & fonts":** the principal offers two or three **variants** of the
   design system as **Looks** (REQ-391). A look *is* a design-system variant. The
   client compares their own pages in each and picks one. They never see the
   words "type scale". They see "Forge", "Sunny yard", "Workshop steel".
4. Later changes ("more air", "the headings feel shouty") are edits to the system,
   made by the principal, and seen on every page at once.

## 7. Laws of craft, measured against the system

The REQ-429 layout check grows checks that are taste-neutral, because they are
relative to the site's own system:

- a heading sits nearer its own text than the block above (follows its role's
  spacing);
- the gap between sections is larger than any gap inside a section;
- sections sit on the grid: edges line up across the page (the existing `edges`
  finding becomes a hold);
- items side by side in a row line up at the top and match in height when they
  are meant to (a photo beside a text panel);
- an image's crop keeps its focal point in frame, and does not cut through a face
  or the subject;
- off-system values above a threshold in a section.

**The critic (REQ-427)** judges each page against the site's own system, as well
as on purpose and messaging. "Does this follow Dina's design?" is a sharper
question than "does this look good?". It re-runs after significant revisions, not
only at the first draft.

## 8. Migration

- Existing sites get a `site.design` built from what they have: `textStyles` →
  type roles, `palette` → colour roles, rhythm unit made explicit from the body
  line height, and `theme` dropped where unused. Inline values on existing nodes
  stay valid and are reported as off-system. Nothing renders differently on
  migration day.
- New sites start without a design system until the principal writes one. The
  starter page (BUG-267) carries no layout values that can survive a build.

## 9. Out of scope

- Section templates or a pattern library (rejected, §2).
- Changing the builder model. That is a separate experiment (Haiku against a
  stronger model on the same brief).
- Raw CSS, or any freeform escape hatch.

## 10. Open questions for the operator

1. Should off-system values be merely reported, or refused for builders (while
   the principal may still use them)? This note proposes "reported, and counted by
   the checks".
2. How many type roles and space steps is the right minimum? Fewer is easier to
   use well.
3. Does the system cover the header and footer parts (REQ-422)? This note assumes
   yes: one system for the whole site.
4. Should the design system be shown to the operator (not the client) in the
   Debug tab or Settings, for inspection?

## 11. Related tickets

- **BUG-267:** logo by visible ink, starter padding, local scrims (its fixes become
  system defaults).
- **REQ-440:** text outline over images (becomes a component/type property).
- **REQ-429:** the layout check framework that the laws of craft extend.
- **REQ-427 / BUG-258 / REQ-438:** the critic, its pictures and its metering.
- **REQ-391:** Looks, which become design-system variants.
- **REQ-432:** the agreed visual direction the system is written from.
- **BUG-266 / BUG-268 / BUG-270:** the build refusals that stopped the consultant
  fixing Dina's draft.
## Implementation tickets (2026-10-24)

- **REQ-447 (part 1, L1):** `site.design` schema and validator, named references on
  nodes, renderer defaults (content width, section/block gaps, roles, aspect and
  focal crops), no silently dropped spacing, off-system reporting, and migration of
  existing sites with no visual change.
- **REQ-448 (part 2, authoring):** the principal writes the design before the
  first build (the host seeds measured facts and validates), builders consume it
  and cannot edit it, Looks become design-system variants, and the Debug tab shows
  it. Blocked by REQ-447.
- **REQ-449 (part 3, judging):** laws-of-craft layout checks against the design,
  `edges` becomes a hold, and the critic reviews against the design and re-runs
  after big revisions. Blocked by REQ-447.

Open questions §10 are taken at this note's proposed answers: off-system is
reported, not refused; the design covers the header and footer; the operator sees
it in the Debug tab. The number of roles and steps is settled in REQ-447.
