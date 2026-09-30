---
uid: request-8b4eb74e
id: REQ-349
type: request
title: Nothing detects an element that paints text and has been given no type, colour
  or padding — unstyled form controls ship looking broken and no tool says so
created_by: xgd
created_at: '2026-09-29T04:28:10.485709+00:00'
updated_at: '2026-09-30T23:13:44.333602+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-6aeb43d5
  commits:
  - working_sha: 815fdfddc042372cddec46451037f380548b908d
    reconcile_sha: null
    main_sha: null
  - working_sha: ad527d7c141af992b75c78635bf80524b32c0245
    reconcile_sha: null
    main_sha: null
  - working_sha: dd9920210a14dd09844c04614adb5a44116639ea
    reconcile_sha: null
    main_sha: null
  version: 0.2.425
  story_points: 5
---

## What I was trying to achieve

Review a page for anything that would make it look unprofessional, and catch it before the client does.

## What stopped me

There is no way to ask "is anything on this page unstyled?" I can read any element and see that it carries no formatting, but only if I already suspect that element. Nothing surfaces it. `describe_page` gives me each element's address and a short label; `get_l1` gives me one element in full. Neither says *this element paints text and nobody told it how*.

So I completed a full design review of a page — hierarchy, palette, type, structure, copy, metadata, accessibility — and missed that all four input fields on it carried **only** a 1px border and a corner radius. No font, no size, no text colour, no placeholder colour, no padding. The browser was therefore drawing their placeholder text in its own default: near-black, hard against the left edge, in a face that had nothing to do with the page. The submit buttons beside them were fully specified. Someone had styled the buttons and never styled the inputs.

The client spotted it. I had looked at a picture of that section and had read the form's container twice while fixing its geometry, and I still missed it, because I was reading the form as a box and never opened it.

## Why this matters more than it looks

This is the single most valuable audit the product could add, for one reason: **it is invisible to exactly the person who most needs it caught.** A novice client will not say "the placeholder colour is unstyled". They will feel the page is slightly cheap and be unable to tell you why — and they will conclude the tool is cheap.

And unlike almost everything else in a design review, it is **decidable**. It needs no taste. It is a mechanical property of the element.

## The sharp version of the rule

"Unstyled" on its own is too blunt — a text element with no colour is usually *fine*, because it inherits the page's own default text colour, and that is a legitimate and common way to write a page. Flagging those would be noise, and an audit that cries wolf gets ignored.

The distinction that makes this precise:

> **What does this element fall back to when it is given nothing — the page, or the browser?**

- A **text** element with no colour falls back to the page's declared default text colour. Fine. Not a finding.
- A **control** with no font, no text colour, no placeholder colour and no padding falls back to *the user agent's* defaults, which have no relationship to the page at all. Always a finding.

Controls are the case where absence of styling is never inheritance and always an omission. That is a rule with no judgement in it.

Worth flagging, in rough priority:

1. A control with no `placeholderColor` — the specific defect here, and the most visible.
2. A control with no padding — text jammed against the border.
3. A control with no `fontFamily` / `fontSizePx` while sibling controls in the same component have them.
4. Any element carrying hardcoded hex colours where the rest of the page uses palette references — a strong signal that something was written by a process that did not know about the site's palette.
5. Sibling inconsistency generally: one control in a form styled, another not.

That last pair would have caught a second problem on the same page independently.

## Where I think it should live, and why

You asked where. My view, and I hold it fairly strongly:

**As a flag on `describe_page`'s entries — not as a separate audit tool.**

The reason is the failure mode itself. What went wrong was not that I looked and misjudged; it was that **I did not think to look**. A separate `audit_page` operation is something I would have to remember to call, and anything I have to remember to call will be forgotten in precisely the sessions that are busy enough to need it. `describe_page` is already the first thing called on any page and is called again after every change, because addresses regenerate. A flag there is free, is unmissable, and arrives at the moment the page is being oriented on rather than at the end.

Concretely: alongside each entry's label, a short marker — `unstyled: placeholder, padding` or similar — and a count in the page-level summary so that "3 elements need attention" is visible even when the entry list is long.

**Why not validation at write time.** Refusing to write an unstyled control would be wrong: a page under construction passes through unstyled states legitimately, and a refusal that has to be worked around trains people to work around refusals. A report is right; a gate is not.

**Why not only in the picture-taking tools.** They are the most expensive things available and are used sparingly and deliberately. An audit that only fires when someone takes a photograph fires least often on the sites being built fastest.

## Related, possibly the same ticket

A second, cheaper check with the same shape and the same argument for living in the same place: **an element that paints text and has been given a colour, where that colour has insufficient contrast against what it actually sits on.** Also decidable, also invisible to a novice, and the page background is already known to whatever renders the page.

## Addendum — two further classes of gap, observed after filing

Since this was written, the same site produced two more defects of the same family. Both were invisible to every existing tool, both would have shipped, and neither is caught by the placeholder/padding rule as originally stated. They widen the request from "unstyled controls" to "egregious style gaps" generally.

### Class 2 — styling silently reverted to a component's built-in defaults

A component was removed and re-added as the method of changing one of its settings. The settings survived. Every page-side styling decision applied to the contents of its slot did not, and the contents reverted to the component's built-in appearance: hardcoded hex values — `#ffffff` fills, `#0f172b` text, `#e5e7eb` borders — on a page whose background is a warm sand and whose every other colour is a palette reference.

Nothing reported this. The change record showed a component removed and one added; it did not and could not say "and the resulting page now contains hardcoded colours that match nothing else on it". The defect was found only because a human was told about the removal and inferred the consequence.

**The detectable property:** an element carrying a literal colour value on a site whose palette is otherwise used by reference. This was listed as item 4 in the original request; the observation here is that it deserves promotion, because it is the *fingerprint* of styling applied by something that did not know the site's palette — a component default, an imported fragment, a generated block. It is not merely untidy. It is the signature of a whole region having reverted.

A useful refinement: report it **proportionally**. A site where 90% of colours are references and 10% are literals has a problem in that 10%. A site with no palette at all has a different situation and should not be nagged.

### Class 3 — a layout that cannot physically work at a width it is declared for

A container holding a text input and a button was set to lay them out side by side at *every* width, including 320px. The input is fluid and the button is 123px wide with 24px of padding each side; the available column at 320px is 272px. It cannot fit, and at that width the arrangement is broken in a way no one would ship deliberately.

This is not a matter of taste and needs no rendering to detect: the declared widths of the children, the gap between them and the width of the space they sit in are all known numbers. When their sum exceeds the container at a declared width, that is a finding.

Related and equally arithmetic: **a child whose declared width exceeds its parent's**. That also occurred on this page — inputs 528px wide inside a 424px box, after a container was narrowed and its children were not. Again: all the numbers are present, no judgement required, nothing detected it, and it was found by a person doing subtraction by hand.

### What these three have in common

Each is (a) mechanically decidable from values already on the page, (b) invisible to a non-expert client, who will register only that the site feels cheap, and (c) currently detectable by nobody.

They also share a failure mode that argues for the placement proposed in the original request. None of the three was missed because someone looked and misjudged. Each was missed because nobody thought to look at that particular element — and in two of the three, the defect was *introduced by an edit made for an unrelated reason*. An audit that must be remembered and invoked will not be invoked at the moment a regression is introduced. A flag on the ordinary page-mapping operation, which is already called after every change because addresses regenerate, would have surfaced all three at the moment they appeared.

### Suggested severity split

If these are to be reported together, they want ranking, so that a genuine emergency is not buried among tidiness notes:

- **Broken** — a control with no styling at all; children that cannot fit their container at a declared width; a child wider than its parent. These are never intentional.
- **Inconsistent** — literal colours on a site that uses a palette; one control styled while its siblings are not; a font stack used once where the page otherwise uses another.
- **Worth a look** — everything else.

Only the first tier needs to be loud.
---

## Implementation scope (free-coded)

Why free-coded: one read-only derivation over data `describe_page` already loads, projected into its output — no new write path, no schema change, no gate.

### What the assistant sees

`describe_page` gains:

- **`attention`** at the top of the result — a count of flagged elements per tier, `{ broken, inconsistent, worth_a_look }`. Always present (all zeros on a clean page), so "3 elements need attention" is visible without scanning a long list.
- **`attention` on each flagged segment** — `{ tier, says: [...] }`. `tier` is the entry's worst finding; each `says` item is a short phrase naming what is wrong and the numbers involved, e.g. `unstyled: font, padding, placeholder` or `children cannot fit side by side at 320px (need 431px, have 272px)`. Unflagged segments carry no `attention` key, so a clean page's map is exactly what it was.

It is a **report, never a gate** — nothing is refused at write time; a page under construction passes through unstyled states legitimately.

### The rules (all mechanical — read only from values already on the page, the site palette, and the component's declared control elements)

**Broken** (never intentional):
1. **Unstyled text-entry control** (`input` other than checkbox/radio, `textarea`) or **button** inside a component. The renderer resets UA chrome (`font: inherit; padding: 0`), so absence falls back to the browser's face and the border edge, not the page:
   - no `fontFamily` while the page's own text names a face → broken (it paints the browser's default face, unlike the page). On a page whose words name no face anywhere, the control matches the page and this is not a finding
   - no padding (absent or every side 0, no responsive padding) → broken (text against the border)
   - text-entry control with no `placeholderColor` **and** no `color` → broken (placeholder paints in the inherited page/browser ink)
2. **Children that cannot fit a row** at a declared width (`l1.widths`): for a non-wrapping `row` (resolved per width through `responsiveLayout`), the sum of in-flow children's minimum widths plus gaps exceeds the row's content width (its width minus its padding). A child's minimum is its fixed width / flow-placed geometry keyframe width, else its `minPx`; a fluid text-entry input with no `minPx` counts the browser's intrinsic input width (150px), because a flex item's automatic minimum stops an `<input>` shrinking below it.
3. **A child wider than its parent's content width** at a declared width (or wider than its grid column).

   Widths come only from declared numbers: viewport width at the root, fixed/fluid `sizing`, flow or absolute geometry keyframes, and block fill in a stack. A width that cannot be known (hug, content-sized) is unknown and never produces a finding. Absolutely placed children are out of flow and excluded from fit checks; hidden nodes (`visibility`) are skipped at the widths they are hidden. A component's slot contents are measured against the page slot they mount into.
4. **Contrast below 2:1** — see contrast below.

**Inconsistent**:
5. **Literal colours on a palette page** — an element carrying hex literals when the site has a palette and most colour uses on this page are palette references. Proportional: a page that is mostly literals, or a site with no palette, is not nagged.
6. **Sibling control inconsistency** — a control with no `fontSizePx` while another control in the same component has one.
7. **Font inconsistency** — a text element with no `fontFamily` while other elements on the page name one (it paints the browser's face); or a family used by exactly one element while another family is used by three or more.

**Worth a look**:
8. A text-entry control with `color` set but no `placeholderColor` (placeholder paints in the same ink as typed text).
9. A control with no `fontSizePx` (no sibling has one either).
10. **Contrast below WCAG AA** (4.5:1; 3:1 for large text ≥24px, or ≥18.66px at weight ≥700).

**Contrast** (rules 4 and 10): the element's effective ink (its own `color`, else the page `textColor`, else black; run colours too) against the backdrop it sits on (its own `surfaceFill`, else the nearest ancestor's, else the page `background`, else white), compositing translucent colours; an opaque fill makes the backdrop known whatever is below it. Skipped wherever the backdrop is unknowable: a gradient, pattern, background image or overlay; and **layered children** — a captured page paints section bands and cards as absolutely placed boxes *beside* the words on them, so below a node with a painted, absolutely placed child the tree does not say which layer a run sits on. There a run that names its panel (`backedBy`) is checked against that panel; one that does not is not guessed at. Also skipped for gradient-filled text.

A text element with **no colour** is not a finding in itself — it inherits the page's declared text colour, which is legitimate (the contrast rule still checks what it inherits).

### Where it lives

- Pure derivation `tools/generate/src/cli/style-audit.ts` (`auditPage`), beside `segments.ts`; reuses `resolveL1Color` (palette), `formatL1Path` (addresses identical to the map's), and `catalog` + `resolveControlNames` (which element a control is).
- `describe_page` (`toolbox-core.ts`) merges findings into `segments` by (module, slot, path) and adds the summary.
- `l1-surface.json`: `describe_page` prose and the `page_map` shape describe the new fields; `surface_version` bumped.

### Test plan

`tests/test_UAT_FC_REQ-349_style_audit.test.ts`, driven through `l1Operations` (the grant's own `describe_page`) over a memory site seeded with a real contact-form instance:
- the ticket's defect: inputs carrying only a border and radius are flagged broken (`font`, `padding`, `placeholder`) while the fully styled sibling button is not; the summary counts them
- a text element with no colour on a page with `textColor` is not flagged
- a row holding a fluid input and a fixed 123px button cannot fit at 320px → broken; a child 528px wide inside a 424px box → broken
- literal colours on a palette page → inconsistent; the same literals on a site with no palette → no finding
- low contrast (pale ink on the page background) → flagged
- a clean, fully styled page → all-zero summary, no `attention` on any segment
- a captured run on a dark sibling band named by `backedBy` is not flagged; an unnamed run on a layered page is not guessed at; a pale run named onto a pale card is broken
- a control with no face on a page whose words name none is not flagged for font
- the declaration names the `attention` field

### Design decisions made during implementation

- **Checked against the real corpus** (`tests/fixtures/l1-corpus`). gigabytealchemy's contact forms, four fields carrying only a border and radius, are flagged `broken: unstyled: font, size, padding, placeholder`. That is this ticket's defect, found unprompted.
- **Two false positives were found and removed:**
  - A first cut took the backdrop from the ancestor chain alone. It called the gigabytealchemy hero "1.1:1, broken", because the hero's words sit on an absolutely placed *sibling* band. That is where the layered-children rule and `backedBy` resolution come from.
  - A first cut flagged every control with no face. On the 1stcontact home page nothing names a face, so the controls match the page. The font rule is therefore relative to the page's own text.
- The palette is read from the site settings, not `get_palette`. The palette tool counts uses across every page, which `describe_page` should not pay for on every map.