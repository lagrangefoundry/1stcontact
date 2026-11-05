---
uid: request-0b26b97a
id: REQ-350
type: request
title: 'L1 pages: scoped geometry and scoped style — sections that carry and push
  their contents, styles set once'
created_by: EPIC-20
created_at: '2026-09-29T05:02:46.487789+00:00'
updated_at: '2026-10-01T22:16:20.530980+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-caf3bb92
  commits:
  - working_sha: 790d904eb4bfea285a97a7e7f6ddfa00cfcbc423
    reconcile_sha: null
    main_sha: null
  - working_sha: 82c42fc2b5ae86f6a7e1c9caa9a98a1529b5f3e7
    reconcile_sha: null
    main_sha: null
  - working_sha: e039827c7c8b01cc078c74545e5ad16173eb39c9
    reconcile_sha: null
    main_sha: null
  - working_sha: f7485abcb86f8f3f5a2f94fedfa11af3fb6524d4
    reconcile_sha: null
    main_sha: null
  version: 0.2.427
  story_points: 20
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


## What landed (implementation session, 2026-10-01)

Steps 1–4 of the plan, and D3. **Step 5 (D2: named spacing, radius and shadow) is not done.** It needs one decision, set out at the end of this section.

### Geometry

**`group_l1`** — model tool in `AuthorPages`, plus `1c structure group <slug> <page> <path…> [--id]`.
- Wraps sibling elements, in page order, in a new `container` at the position of the first.
- The container sits at x = 0, spans its parent's full width, and its top follows the members. Where every member shares one keyframe ladder and segment flags, the top is exact at every width; otherwise it is a constant.
- Members are rebased with the fold's own `rebaseInto`, now shared through `tools/generate/src/l1/rebase.ts`.
- The page renders identically at every width and viewport height, not only at the captured ones. No measurement is needed, so it runs in the Worker.
- Moving or resizing the container carries its contents.
- Refused, with the page unchanged (`SCHEMA_INVALID`, or `NOT_FOUND` for a missing address), when:
  - the addresses are not siblings;
  - a member is already placed `flow`;
  - grouping would change what paints over what (a non-member between two members that overlaps a later one). The refusal names the element.

**The served reproduction flows by section** (`promoteToFlow`, judged by `chooseRecovery`).
- On the page root and every fold-made surface (section band, section background, card) where no collision defined regions, every pinned child now joins the flow. Collision regions still form where collisions exist.
- A painted `box` that holds nothing (a divider rule, a decorative plate) stays where it is, behind its neighbours.
- **On a tie, the flowed page is served:** "no worse" is enough, where a strict improvement was required before.
- Measured, by the layout evaluator against the capture's own text heights:
  - **gigabytealchemy.ai:** 69 of 69 elements flow, and nothing is left absolute. Under 2.5× content growth, overlaps drop from 301 to 59 and escapes from 84 to 2, with fidelity unchanged. The remaining overlaps are in one card whose capture order is not its visual order; REQ-278 keeps those as negative offsets.
  - **faelan.com:** served flowed, where before it was served flat by default.
  - **joyfulculinarycreations.com:** still not served, because the repair would lose fidelity.
- The contact block's three runs ("Get in touch", the mailing-list line, the Turnstile notice) are held by no section, because the capture paints them straight on the page with no band.

**`flow_l1`** — model tool in `AuthorPages`, plus `1c structure flow <slug> <page> <path>`. This implements D1:
1. A `PageMeasurer` renders the draft over the preview channel `screenshot` uses, at each of the page's widths, and reads every run with the capture extractor.
2. `promoteToFlow`, given the new `only: <address>` option, converts that one container.
3. The page is written, rendered and measured again.
4. If any run is more than 0.5px from where it was at any width, the original page is written back and the refusal names the run, the width and the distance.

With no browser it refuses with `ENVIRONMENT`; there is no estimate. In the Worker the measurer comes from the same `fidelity` deps as the drawing measurer. On Node, `1c structure flow` starts a temporary builder origin.

### Style

**Named text styles.**
- `site.textStyles` holds named, typed, `.strict()` bags: `fontFamily`, `fontSizePx` (1–400), `fontWeight` (1–1000), `lineHeightPx`, `letterSpacingPx`, plus `responsive` per-width tracks for the last three.
- `site.textDefault` names the style every page inherits from the top.
- A run or control names a style with `axes.textStyle`.
- A `box` or `container` carries `type: { style?, …axes }` for what it contains.
- **Precedence, nearest first:** the run's own value; the run's own style; the nearest container's own value; that container's style; outward; then the site default. A per-width track and a single value are one axis, and the nearer wins it.
- **One resolution pass, `resolveL1TextStyles`,** runs where the palette is resolved: site assembly, and the renderer's document, fragment and email entries. The renderer, evaluator and round-trip gate see only literals, so the output is pixel-identical by construction.
- **Validation.** `validateL1` refuses a style name the site doesn't declare (new rule `declaredTextStyle`). It then runs every existing check on the resolved page, so a named or inherited value meets the same range, ladder and served-font rules as a literal. The font-reference check and the `describe_page` style audit also read type as it paints.

**Tools** — `get_text_styles` (in `ReadSite`) reports each style, whether it is the default, and every use by page and address. `set_text_style`, `add_text_style`, `remove_text_style` (refused while in use or while it is the default) and `rename_text_style` (rewrites every use in one write) form a new `ManageTextStyles` grant, given to the consultant and builder roles. CLI: `1c type get|set|add|rm|rename`.

**`1c type assign <slug>`** is the retrofit, following `1c colors --assign`.
- It groups runs whose five type axes match exactly. Nothing a pixel apart is merged.
- **Naming:** a group mostly used by headings of one level is `heading-<level>`; the most used other group is `body` unless that name is taken; the rest are `text-<size>`.
- **Container type:** a container whose runs all share one style sets it as its `type`.
- **Default:** an existing default is kept. Otherwise `body` becomes the default only if every run on the site sets every axis `body` sets, so a run that relied on the browser's own line height doesn't start inheriting one.
- Existing styles are kept, never deleted.
- It refuses the write unless every run, including component slot runs, resolves to exactly the type it had. On Gigabyte Alchemy the served page is byte-identical before and after.

### D3 — `theme.typography` retired; one answer for type

- `typography` is removed from the theme schema. `defaultTokens` and `generateThemeCss` no longer emit the type scale, weights, line heights, tracking or sub-scales; nothing live read them.
- `generateThemeCss(tokens, textStyles)` emits one `--font-family-<name>` per named style that sets a family. It applies the L1 renderer's own family sanitiser (`cssFontFamily`, now exported).
- `CALLOUT_CSS`'s `var(--font-weight-medium)` became the literal `500`.
- The generator's page-shell rules `body { font-family: var(--font-family-body) }` and `h1, h2, h3, h4 { font-family: var(--font-family-heading) }` are gone; the default style is resolved into every run and control instead.
- New and reproduced sites start with `textStyles: { body, heading }` (the system stack) and `textDefault: 'body'`.
- **Stored sites are lifted on load** (`tools/generate/src/store/legacy-typography.ts`, in `assembleSite` and in the edit commands' reads), and the first write persists the new shape:
  - the theme's body, heading, display and label families become styles of those names;
  - `body` becomes the default;
  - where the heading family differed from the body family, a heading run (levels 1–4) that set no family takes `textStyle: 'heading'`, which is exactly what the shell's `h1`–`h4` rule gave it.
- **Scope finding:** the legacy modules read the whole typography group, not just the families. But every reader other than the shell and `CALLOUT_CSS` is unreachable: `renderMarkdown` and the `text-style.ts`/`dials.ts` resolvers have no callers, and no legacy layout module remains. So retiring the whole group leaves no second source. Those dead resolvers still exist and were not deleted here.

### Earlier acceptance language this supersedes

These tests were updated in place, each saying why:

| Earlier test | Clause | Now |
|---|---|---|
| AC709 | "demanded, not applied by default": a roomy region is left absolute | a roomy page flows whole, as one region |
| BUG-9 | `roomy_page_left_absolute` | `roomy_page_flows_as_one_region` |
| AC737, REQ-88 | a clean bundle promotes nothing | it promotes the page itself (`['0']`) |
| REQ-278 | the recovery must *strictly* improve the envelope | no worse is enough |
| BUG-142 | the band carries the viewport-height term | the band is pushed by the hero, which carries it |
| BUG-142 | at-rest fidelity measured with estimated heights | measured with the capture's own heights |

The theme-typography assertions in REQ-4, REQ-24, REQ-33, REQ-36, REQ-45, REQ-49, REQ-56, REQ-114 (AC933, AC936) and REQ-130 / AC1095 are rewritten to the named-style source or removed where nothing remains to emit. `tests/req45-fidelity-primitives.test.ts` was deleted: its only test asserted the retired tracking properties.

### Test plan (as landed)

| Area | File | Tests |
|---|---|---|
| Group (geometry 1, 4, 5) | `test_UAT_FC_REQ-350_group_structures_a_flat_page.test.ts` | grouping a section nests its contents and renders identically across captured widths, beyond them and at three viewport heights; moving the group carries its contents; refusals (not siblings, paint order, missing) leave the draft byte-identical; a flat absolute page stays valid; a Chromium-gated browser round trip |
| Served page flows (geometry 1–3, reproduction) | `test_UAT_FC_REQ-350_the_served_page_flows_by_section.test.ts` | synthetic three-section capture: sections carry their runs and both flow; growing early content pushes later content down by exactly the growth with no overlap, where the flat base overlaps; reproduces the capture within 0.5px at every captured width; the real GA capture is served nested and flowed with overlaps cut by more than ¾ |
| `flow_l1` (geometry 2–4, D1) | `test_UAT_FC_REQ-350_flow_stacks_a_section.test.ts` | stacking a grouped section keeps the render and pushes later content down; refused without a browser; a measured drift puts the page back and names the run; a Chromium-gated real-browser leg. The browser is the only stand-in: an evaluator-backed `PageMeasurer`. |
| Named and inherited type (style 6–10) | `test_UAT_FC_REQ-350_type_is_set_once.test.ts` | `1c type assign` leaves the served page byte-identical; changing one style changes exactly the runs that use it; a container value is inherited, a run's own style beats it, and a local value beats both; untyped, unknown-axis, raw-CSS, out-of-range and unserved-family styles are refused, as is a run naming an undeclared style; `get_text_styles` reports addresses that resolve to the naming element; rename moves every use; remove is refused while in use |
| D3 | `test_UAT_FC_REQ-350_theme_typography_becomes_named_styles.test.ts` | a stored `theme.typography` loads as named styles with no shell font rule and the same face on the form inputs; a heading that relied on the heading family keeps it; the first write persists the new shape; a new site starts with named styles |

Browser-gated legs skip in the sandbox (Chromium is blocked there); the operator runs them.

### D2 — not done; one decision needed

Done as named bags like the text styles (`site.boxStyles`: `borderRadiusPx`, `boxShadow`, `padding`, `gapPx`, referenced by name and resolved at the boundary), this needs **no numeric-type widening**. The renderer and evaluator would still see only literals, and the cost is about the size of the text-style work.

The open question is what **inheritance** means for these properties. Type inherits naturally (CSS does it), but radius, shadow, padding and gap do not. "A container sets it for what it contains" could mean either of:
- **(a)** every painted descendant that names no box style of its own; or
- **(b)** only the container's direct children (the cards of a grid, the panels of a section).

**Recommendation: (b).** It is the case that occurs in practice ("the cards in this section share a radius"), and (a) would push a section's padding into every card nested inside it.

The theme's `spacing`, `radius` and `shadow` groups stay until D2 lands, then retire the way `typography` did. Their only live reader is `CALLOUT_CSS`'s `--space-1`/`--space-6`.