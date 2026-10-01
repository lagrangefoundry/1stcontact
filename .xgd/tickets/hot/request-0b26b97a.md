---
uid: request-0b26b97a
id: REQ-350
type: request
title: 'L1 pages: scoped geometry and scoped style — sections that carry and push
  their contents, styles set once'
created_by: EPIC-20
created_at: '2026-09-29T05:02:46.487789+00:00'
updated_at: '2026-10-01T20:08:15.619296+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-caf3bb92
---

## What this is

A page should say **where things are relative to each other**, and **what a style is once**, instead of repeating both on every element. Today a stored page does neither:

- Every element is placed against the page itself. Grow the header and nothing below it moves. You have to push every element down by hand, at every screen width.
- Every text element carries its own font family and its own size. Changing "the body font" is one edit per element.

This ticket covers both: **scoped geometry** (sections that carry their contents, and content that pushes what follows it down) and **scoped style** (every style parameter can be set once and inherited or referenced, the way colours already are).

## What we found (corrected 2026-09-30 — the original premise was wrong)

The first version of this ticket said reproduced pages contain no structure. That is wrong for current reproductions.

- **The fold already nests.** Since commit `8ecd455d16` (2026-09-25, *"a backing surface owns the content it backs"*), `foldToL1` places content inside its section and card containers. The Gigabyte Alchemy capture (`storage/references/gigabytealchemy.ai/index/l1.json`) comes out as 11 sections, three levels deep. Children's coordinates are measured from their section. In "Our Mission", the section is at `y: 1612` and its heading at `y: 96` within it.
- **The Gigabyte Alchemy site predates that.** It was created 2026-09-06 and was never re-folded, so its home page (`site_pages`, `home.json`) is the older shape: `root` with **69 direct children, depth 1**. The sections survive only as empty backing boxes (`section-band-0`…), and the text is painted over them as siblings. Its first recorded edit already addressed element `0.68`.
- **Nothing uses `flow` placement.** The language has had it since REQ-278 (`geometry.place: 'flow'`). The schema's own description: *"an `absolute` sibling stays put and is overrun, a `flow` sibling is pushed down."* Both the capture and the live page place **all 70 elements `absolute`**. So even the nested capture only means that moving a section carries its contents. Growing the header still overlaps the section below it.
- **Colours are already scoped. Type is not.** On the live page all 52 colour settings are palette references (`{"ref": "slate"}`), and the page has a default text colour. But `fontFamily` is a literal string on 52 text elements (1 Cinzel, 51 system sans), and `fontSizePx` is set separately on 52. There is no named text style and no way for a container to set type for what it contains.

## What it cost in the session that found it

From the first live delegation session (2026-09-29, Gigabyte Alchemy; recorded on EPIC-20):

1. **A repair had to be eight pairs of coordinates.** "Attach these forms to their section" could not be said, because there was no section to attach them to. The consultant computed per-width x/width values instead.
2. **Narrowing a box did not narrow what was painted on it.** The fields were siblings, not children, so 528px inputs sat in 424px boxes.
3. **It maximises the work that cannot be delegated.** REQ-348's finding is that the consultant's irreducible cost is computing values, and a page with nothing scoped turns every change into values.

## What must hold — geometry

1. **A section carries its contents.** Content that belongs to a section is a child of it, with coordinates measured from the section. Moving or resizing the section moves its contents.
2. **Content that follows other content is pushed down by it.** Sections within the page, and content within a section, are placed `flow` wherever that reproduces the capture. The test is the header case: making an element taller moves everything after it down, and nothing overlaps.
3. **Render-identical at the captured widths.** Nesting and `flow` change the description, not the output. At every captured width the page renders as it did. This is the existing round-trip gate (`capture(render(L1)) ≈ L1`, DOC security policy §4), and it is the judge.
4. **Existing flat pages can be structured without re-capturing.** An operation takes a set of element addresses, makes them children of a new container, rebases their coordinates, and keeps the render identical. A second operation switches a container's contents to `flow`. The consultant decides what forms a section (a judgement about meaning); the host does the arithmetic.
5. **Flat stays valid.** Nothing here makes an `absolute` page invalid.

## What must hold — style

6. **Every style parameter can be set once and referred to.** Colours already work this way (palette references). The same model extends to the rest: at least font family, size, weight, line height and letter spacing as named text styles (e.g. heading, body, caption), and repeated values such as spacing, corner radius and shadow. Changing the named value changes every element that refers to it.
7. **A container can set style for what it contains.** A value set on a container is inherited by its descendants unless they set their own, the way the page's default text colour already falls back. This depends on geometry item 1: nothing can be inherited on a page with no containers.
8. **An element can still override.** A local value wins over an inherited or named one.
9. **Structured only.** Named styles and inherited values are typed and validated like every other L1 value. No raw CSS enters through this (security policy §1–§3).
10. **The AI can see and change the scope.** Tools exist to read and change a named style or an inherited value, and to see what refers to it, the way palette colours are managed today.

## Changes to reproduction

- **Nesting: already done** for new reproductions (`8ecd455d16`). Keep it, and make it a guarded property so it doesn't regress.
- **`flow`: new.** The fold must emit `flow` for sections in the page and for content within sections, where the round trip holds, instead of `absolute` everywhere. The current only writer, the collision-repair step (`promoteToFlow`), is not enough.
- **Style: new.** The fold must emit named styles and container-level values, found by grouping elements that share a value, instead of literals on every element. This follows the pattern the fold already uses to turn captured colours into palette references.
- **Existing sites** (Gigabyte Alchemy and anything else created before 2026-09-25) get structure either by being re-folded or through the operation in geometry item 4.

## Open questions

- **How far to group.** Nesting by geometric containment is mechanical. Deciding that two text runs share "body" style is clustering, and over-grouping (merging styles that differ by one pixel on purpose) is a real risk. The round-trip gate catches render changes, not wrong intent.
- **Which parameters get named styles, and which get inheritance only.**
- **The site-level `theme.typography` in `site_json`** (heading/body families) already exists and appears unused by L1 pages. It should become the named text styles or be retired, not left as a second answer.

## Size

This is large and likely too big to free-code as one unit. The natural split is geometry (items 1–5) and style (6–10). Geometry is mostly emission and one operation over language that already exists. Style needs new language.

## Test plan

UATs (`test_UAT_FC_REQ-350_*`), against real captures:
- a fold of the GA capture nests contents in sections and places them `flow`; growing an early element moves later content down with no overlap; the round trip holds at every captured width;
- the group operation on the live flat GA page produces a render-identical nested page;
- a named text style changed once changes every element referring to it; a container value is inherited and a local override wins;
- the validator refuses a style value that isn't typed;
- a flat `absolute` page still validates and renders unchanged.



## Decisions (2026-10-01, answering the implementation session's questions)

These answer the three questions in this ticket's chat transcript, and settle the open questions above. Where they conflict with anything earlier in this body, this section wins.

### D1 — How the host learns text heights for `flow`: measure with the browser the Worker already has. Don't store heights on the page.

- **`flow` needs heights only at conversion time.** A `flow` element renders as ordinary CSS flow (`render.ts`, `geo.place === 'flow'`), so the browser works out heights whenever the page is shown. The host needs a height once: to turn an absolute `y` into a gap below the element above it. After that, nothing reads it.
- **So heights are not stored on the page.** A stored height goes stale the first time someone edits the text, and the AI edits copy constantly. Converting from a stale height produces exactly the overlap `flow` exists to prevent, with nothing to flag it.
- **The Worker already has a headless browser.** `env.BROWSER` is bound in every environment (REQ-154) and already drives `screenshot` and `capture_site` (`sessionFidelity` in `router.ts`). Using it adds no dependency. The Node builder uses Playwright, the same as `1c shot`.
- **What `flow_l1` does:** render the current draft, measure the container's children at each of the page's declared widths, compute the gaps, convert, then render again and check the result matches the first render. If it doesn't match, change nothing and say which element and which width differed.
- **With no browser available,** `flow_l1` refuses and says so, the way `screenshot` is absent without one. No estimating heights: an estimate isn't render-identical.
- **The fold emits `flow` directly.** It already holds the capture's measurements, so it needs no browser.
- **Not done:** recording heights on the page, and filling heights from the saved capture by matching text. That would be a second way of answering the same question, and it goes stale as soon as the page drifts from its capture.
- **Older pages** (Gigabyte Alchemy and anything before 2026-09-25) get structure through `group_l1` and then `flow_l1`, or by being re-folded. No separate backfill command.

### D2 — Spacing, corner radius and shadow: yes, in this ticket, after type.

The operator asked for scope over **all** style parameters, so stopping at type would not meet the ticket. The order the session proposed is fine: text styles fully first, then named spacing, radius and shadow through the same mechanism (named value, reference, inheritance, local override), last. If the numeric-field widening turns out much larger than expected, stop after type and report the size; don't drop it silently.

### D3 — `theme.typography`: agreed, with one condition. There must be one answer.

Replace the page-shell rule with a site-level default text style that every page inherits from the top. The condition is that the legacy modules don't keep reading `theme.typography` as a separate source. Generate the `--font-family-*` variables they use from the named styles, so a style changed once changes both. `theme.typography` is then retired from `site_json`, with existing values migrated into the named styles. If the legacy modules can't be pointed at the new source cheaply, say so in this ticket rather than leaving two sources.

### Also settled

- **How far to group (open question 1):** exact matches only, as the session proposed. Nothing merges values that differ by a pixel. The `1c` retrofit follows `1c colors --assign`.
- **Which parameters get named styles and which only inherit (open question 2):** every parameter in D2 gets both. One mechanism is simpler than two.
- **`group_l1`'s container** spans its parent's full width and fits the members' vertical extent, reusing the fold's own coordinate rebasing. Agreed.
- **Browser-gated tests** may skip in the sandbox; the operator runs them. The layout evaluator against the saved Gigabyte Alchemy capture is acceptable as the in-sandbox evidence.
- **Live sites aren't touched by this ticket.** The dev Gigabyte Alchemy is being recreated from a fresh reproduction (EPIC-20), which will exercise the new fold.


## Implementation plan (implementation session, 2026-10-01)

Build order on one branch (`free-REQ-350`). Each step is its own commit, so a stop part-way still leaves a coherent ticket.

1. **`group_l1`** (geometry 1, 4). Model tool + `1c` command. Takes sibling addresses under one parent and wraps them, in document order, in a new `container`:
   - **Shape:** absolute; spans the parent's full width; vertical extent fitted to the members.
   - **Rebasing:** members are rebased with the fold's own `rebaseInto`, moved to a shared module rather than copied.
   - **Refusals:** addresses that aren't siblings, a member already placed `flow`, and a selection whose regrouping would change paint order. Paint order changes when a sibling between the members overlaps one of them.
   - **Render-identical by construction:** every member keeps its own absolute placement, so no measurement is needed and it runs in the Worker.
2. **The fold emits `flow`** (geometry 1–3, "Changes to reproduction").
   - **Rule:** `promoteToFlow` flows every section within the page and every content element within a section, not only regions that collide.
   - **Judge:** `chooseRecovery`'s existing fidelity rule still decides whether the flowed document is served.
   - **Guard:** nesting on the GA capture becomes a guarded property.
3. **`flow_l1`** (geometry 4, D1).
   - Renders the draft through the session's browser and measures the container's children at every declared width.
   - Converts them to `flow` using the same leading-offset arithmetic as `promoteToFlow`, which is shared, not duplicated.
   - Re-renders and compares. On any mismatch it writes nothing and names the element and width.
   - With no browser available, the tool is refused.
4. **Named and inherited text styles** (style 6–10, D3).
   - **Storage:** `site.textStyles` holds named, typed bags (family, size, weight, line height, letter spacing, and per-width tracks for the three axes that vary by width).
   - **Reference:** a text or control element refers to one with `axes.textStyle`.
   - **Inheritance:** a container can carry the same typed text axes and a `textStyle`, and its descendants inherit them.
   - **Precedence:** an element's own value wins, then its own named style, then the nearest ancestor's value, then the nearest ancestor's style, then the site default style.
   - **Resolution:** one pure pass, `resolveL1Styles`, runs where `resolveL1Palette` runs (assemble and renderer entry). Downstream code sees literals, so the result is pixel-identical by construction.
   - **Tools:** get, set, add, remove and rename, each reporting where the style is used (paths), not just a count.
   - **Retrofit:** `1c type --assign` groups exact matches only.
   - **Page-shell rule:** the `body`/`h1–h4` font-family rule is replaced by the site default style.
5. **Named spacing, radius and shadow** (D2), through the same mechanism: named value, reference, inheritance and local override.
   - **D3 scope finding:** the legacy modules read the whole `theme.typography` group (step sizes, weights, line heights, tracking, sub-scales), not just families. `theme.spacing`, `theme.radius` and `theme.shadow` are also a second answer to D2.
   - **Plan:** the named values absorb all of them. The `--font-*`, `--space-*`, `--radius-*` and `--shadow-*` variables the legacy modules use are generated from the named values, and `theme`'s token groups are migrated and retired.
   - **If that isn't cheap,** stop and report the size here, per D2.

Test evidence in the sandbox is the analytic evaluator against the saved Gigabyte Alchemy capture (Chromium is blocked there). Browser-gated UATs (round trip, `flow_l1` against a real browser) run on the operator's machine.