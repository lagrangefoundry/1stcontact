---
uid: request-0b26b97a
id: REQ-350
type: request
title: A reproduced page is 69 siblings at depth 1, so nothing can be attached to
  a section and every layout repair is coordinate arithmetic
created_by: EPIC-20
created_at: '2026-09-29T05:02:46.487789+00:00'
updated_at: '2026-09-29T05:02:46.487789+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
---

## What is missing

A reproduced page has no structure, so nothing on it can be attached to anything
else, and every layout repair is coordinate arithmetic done by the most expensive
session in the system.

The vocabulary is not the problem. `box` and `container` both take `children`, and
`container` carries `layout`, `responsiveLayout`, `gapPx`, `padding`,
`distribution` and `align` — a section that lays its own contents out is fully
expressible. Reproduced pages simply contain none of it.

## Measured, on the page this was found on

Gigabyte Alchemy home (`site_d669b155…`, `home.json`, 68 KB of L1):

- `root` is one `box`, with **69 direct children**.
- **Maximum depth is 1.** Not one of those 69 nodes has a child.
- 16 `box`, 52 `text`, 2 `slot` — every heading, paragraph, card, form and field a
  sibling of every other, each pinned by its own per-width `geometry`.

So "the Get in touch section" is not a thing on this page. It is a spatial
coincidence among fourteen siblings.

## What that cost, in one session

**1 · The repair had to be eight pairs of coordinates.** The two forms were not
tracking their section when the viewport height changed. The correct instruction —
*attach these to the section they belong to* — is inexpressible, because there is no
section to attach them to. What was delegated instead was six widths of computed
x/width values per element, every one of which the caller had to derive first.

**2 · Narrowing a box did not narrow what is inside it.** The consultant's next
brief gave exact widths for the form boxes. The fields inside them kept their old
width — 528px inputs in a 424px box, 104px of overflow — because the fields are not
inside anything. They are siblings painted over the box. The consultant recorded this
as its own error for not naming the children; the deeper reason is that there were no
children to name, and no brief can name a relationship the document does not hold.

**3 · It maximises the one part of the work that cannot be delegated.** REQ-348's
finding, from seven runs, is that the caller's irreducible cost is *computing the
values* — the worker transcribes. A flat page means every layout change is values.
Grouping would turn a class of repairs from eight computed coordinate pairs into one
declarative instruction, which is a direct reduction in the expensive half of every
delegation, not a reduction in the cheap half.

**4 · Possibly the renumbering, though this one needs checking.** Run 7 returned
nothing after a full budget, and its post-mortem is that inserting an element
renumbers the addresses the rest of the brief depended on, making a one-job brief
into two phases. Whether grouping would localise that renumbering depends on how
addresses are derived, which I have not established — noted as a question, not a
claim.

## What must hold

1. **A page that renders exactly as it does today can be expressed with the
   structure it visibly has.** Grouping is a change of description, not of output: the
   rendered result before and after must be indistinguishable, and that is the
   property any such operation is judged on.
2. **A child's placement can be relative to its container**, so that moving or
   resizing a section carries its contents. This is the capability the whole ticket is
   for; grouping that still required per-child absolute geometry would buy nothing.
3. **It is incremental and does not require re-capturing.** An existing flat page
   must be groupable a section at a time, because the pages that need this most are
   the ones already built and already being edited.
4. **Nothing is required to use it.** A flat page stays valid. This adds an
   expressible structure, it does not make absolute placement wrong.

## Where it could come from, and the open question

Two candidates, and I am not picking between them here:

- **At capture or fold time** — the reproduction already measures every box's
  geometry at every width, which is the information a containment guess would be made
  from. It would arrive structured and no page would need repairing twice.
- **As an operation on an existing page** — *take these addresses, make them children
  of a new container, and keep the render identical.* Works on pages that already
  exist, which capture-time inference does not.

The honest open question is how much of the grouping can be inferred and how much has
to be asserted. Nesting by geometric containment is mechanical; deciding that
fourteen siblings are one *section* is a judgement about meaning, and a wrong guess
that silently reparents content would be worse than the flat page. That argues for
the operation being driven rather than automatic, at least first.

## Why this sits under EPIC-20

It was found as a delegation-cost finding and it is the largest one in the session:
the consultant's own assessment was that it is *"a bigger lever on delegation cost
than anything in the brief-writing discipline"*, because it converts coordinate
arithmetic into one-line briefs. Its value is not confined to delegation — a
structured page is easier for anything to edit, including a person — but the cost
argument is what makes it urgent.

## Related

- **REQ-348** — the briefing discipline, and the finding that computing the values is
  the caller's irreducible cost.
- **AC-1088** — the group-shaped edit the surface already describes: read the group
  that should hold it, send the group back with the element among its children. That
  contract exists; a reproduced page has no groups to use it on.
