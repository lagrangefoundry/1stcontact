---
uid: request-3ed38543
id: REQ-391
type: request
title: 'Alternative looks: labelled sets of a page, browsed in a preview carousel
  with an animated swap and one-click choose'
created_by: EPIC-19
created_at: '2026-10-04T23:28:45.706501+00:00'
updated_at: '2026-10-05T01:47:37.831258+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5372f631
  commits:
  - working_sha: 3036062eb7c5c4ccbb911a0030c9c044addf936d
    reconcile_sha: null
    main_sha: null
  - working_sha: bd29b63261d84246a9461dc392c9b4e4c58fff24
    reconcile_sha: null
    main_sha: null
  version: 0.2.496
---

## What changes

Alternative versions of a page ("looks") are first-class: labelled, kept out of the page list, and browsed in the preview with a carousel (**‹ Workwear · 1 of 3 ›**), an animated swap between them, and a **"Choose this one"** button. The same carousel is used to browse comps (REQ-378).

## Why

In Charlie's Plumbing 3 the consultant built three looks as ordinary pages (`/workwear`, `/coastal`, `/trade`) marked "unreachable". Operator: "the UI for switching options was not designed for that purpose. A user would not know how to find it and the qualifier 'unreachable' is confusing… these pages are special, they should not appear in the same drop-down with the others. They should have their own identifiers and we put them in a carousel with < and > buttons and 2 of 3." Choosing one then cost a 5–10 minute builder session to copy it onto the home page and delete the rest by hand.

## Requirements

1. **An alternative is metadata, not a naming convention.** A page can be marked as an alternative of another page, with: the page it's an alternative of (e.g. `home`), a client-facing label ("Workwear"), a one-line description, and the set it belongs to. The consultant creates a set through an operation (for example, copying the target page N times, REQ-301's copy-a-page, labelled), not by hand-naming pages.
2. **Alternatives never appear in the page dropdown, and the word "unreachable" never reaches the client.** They're unpublished and unlinked by construction, as today's practice pages are.
3. **Opening a set** (from a chat link the consultant posts, or from a "Compare looks" control that appears while a set exists) puts the preview into carousel mode: ‹ label · n of N ›, the label's description, and **"Choose this one"**. The width control (REQ-388) and "Open in a new tab" still work on the shown alternative. **"Back to your draft"** leaves the carousel.
4. **Animated swap.** Moving between alternatives cross-fades or slides. The next and previous alternatives are preloaded in a second frame so the swap is instant. Honour reduced motion with an instant swap.
5. **Choosing is one action, not a builder session.** "Choose this one" (by the client, or by the consultant on the client's say-so) replaces the target page's content with the chosen alternative, records the choice in the plan's decisions (with the set and the rejected labels), and archives the other alternatives. It's revertible through the normal revision history.
6. **One component with comps.** REQ-378's comp viewer adopts the same carousel (‹ Duncan Plumbing · 1 of 3 ›), without "Choose this one", since comps are never chosen onto the site.
7. **The consultant's manual and priming** describe sets ("build alternatives as a set; the client compares them in the carousel"), and it posts a link that opens the set.

## What landed

**The data.** A page may carry an `alternative` block (`packages/site-schema`): `of` (the page it is a look for), `set`, `label`, optional `description`, `order` (its place in the carousel; the page store lists by key, so the set carries its own order) and `archived`. Validation: `of` must name a page the site has that is not itself a look; an email page cannot be a look; a page cannot be a look of itself; no nav entry may point at a look.

**Never published, always previewable.** The renderer's served set excludes looks (as it excludes email pages), so a published revision has no file for one and the home-page fallback never picks one. The builder's preview render includes them; its option was renamed `emailPages` → `unpublishedPages` because it now covers both.

**Making a set — `make_alternatives` (l1 surface, `ManagePages`).** One call, one validated write: `{ page, looks: [{label, description?, page?}], set? }`. Each look is a full copy of the target page (REQ-301's copy semantics: content, page style, components) with id `<page>-<label-word>`, title `<page title> — <label>`. Leaving out `set` starts a new one (`<page>-looks`, `-2`, …); naming an existing set of the same page adds to it, and a set of another page is refused (CONFLICT). A look entry naming an existing `page` adopts that page into the set (how Charlie's hand-built `/workwear` becomes a look) or relabels a look already in it. The answer carries the chat link `[Compare the looks](#looks=<set>)`. Where construction is commissioned (the consultant is read-only), the builder worker makes the set and the consultant posts the link with the set name `list_pages` shows.

**The page listing.** `GET /api/pages` / `list_pages` rows carry the `alternative` block. The human listing (`1c page list`) says `look "Workwear" for 'home' in set 'home-looks'` (plus `(archived)`) instead of an unreachable note.

**The dropdown.** Looks are filtered out of the builder's page dropdown. An ordinary unlinked page now reads "— not linked from the site" instead of "— unreachable" (supersedes the label REQ-248/REQ-252 pinned; their UATs updated).

**The carousel (builder).**
- `carousel.js` is the one shared control: ‹ label · n of N › with its description line. The arrows stop at the ends, and ←/→ work while it has focus.
- `looks.js` is the controller plus two toolbar actions:
  - **Compare looks** appears after the page dropdown in View and Edit, only while a live set exists. It prefers the set for the page on screen.
  - The **looks bar** carries Back to your draft, the carousel, Choose this one, and an error line.
- The looks mode is a transient *document* mode with actions `looks`, `preview-width`, `open-new-tab`, so the width control and Open in new tab work on the shown look unchanged. Nothing that edits or publishes is in it.
- A chat link `#looks=<set>` opens the set. `chat.js` gains a delegated `onLinkClick`, the twin of `onImageClick`.
- Leaving for another site exits the carousel.
- The page carry (REQ-215) never captures a look, so "Back to your draft" returns to the page you were on.

**Animated swap.** The panel gains spare frames:
- `preload(urls)` loads the neighbouring looks behind the shown one.
- `swapDocument(url, direction)` swaps to a preloaded frame, or navigates one, with a fade-and-slide in CSS. The animation uses the `translate` property, so it composes with the REQ-388 width scaling.
- Under `prefers-reduced-motion` the swap is instant.
- Spare frames are laid out at the chosen width like every frame.
- A transient mode's frame is created when first entered, not at registration.

**Choosing.**
- **The client:** `POST /api/pages/choose {site, look}`.
- **The consultant:** `choose_look {look, client_said}` on the **plan** surface, in group `PlanWork`. The plan surface is never narrowed, so this works where construction is commissioned; the host lends it the one site write as a port.

Both run `editAlternativeChoose`, then record the decision with `lookChosen` (plan-core):
- **The page:** the target keeps its id, slug, title and search metadata, and takes the look's L1 document and components.
- **Revertible:** there is no draft undo, so the page's previous content is kept as an archived look labelled "Before <label>" in the same set. Choosing that look puts the page back.
- **The set:** every look in it is archived (not deleted), out of the carousel and the page list.
- **The decision:** `look-<set>` is set to `chosen` and `compared`, with value = the label and the client's words attached (the button press is described for the client path). A `### Decision N` log entry names the set and the "Not chosen" labels. Choosing again in the same set updates the same decision.
- **The site write comes first,** so the plan never records a choice the page didn't take.
- **No ticket store (the `1c` dev builder):** the look is chosen and nothing is recorded.

**Comps.** The comp viewer's banner uses the same carousel (‹ Duncan Plumbing 1 · 1 of 3 ›) with no Choose. "Viewing: X" and the Previous/Next text buttons are replaced (REQ-378's UAT updated).

**Consultant.**
- **Priming:** a "looks" entry follows "comps" in both priming lists. It says to build looks as a set, that looks are never pages and never "unreachable", to post the `#looks=` link, and to use `choose_look` with the client's words.
- **Declarations:**
  - `l1-surface.json` goes to surface_version 18 with `make_alternatives`, a `look_list` param type (an array of objects), and the old "two treatments" sequence rewritten for sets. `copy_page` now points to sets.
  - `plan-surface.json` adds `choose_look` and the errors `UNKNOWN_LOOK` / `NO_LOOKS`.

## Design decisions made during implementation

- **The carousel is a document mode on the panel, not a mount mode.** A look is the site's own draft page, so it is shown live, at the client's width. That keeps the width control and Open in new tab working with no special cases.
- **The consultant's choice lives on the plan surface, not the site surface.** In a commissioning deployment the consultant holds no site-write groups. Choosing records a client decision, which is plan business.
- **"Archive" means `alternative.archived: true`.** Pages are kept, not deleted. With no draft revert, the archived "Before" look is how a choice is undone.
- **Order is explicit** (`alternative.order`), because the page store's order (by key) is not the order the consultant offered the looks in.

## Test plan

UATs named `test_UAT_FC_REQ-391_*`:
- `tests/test_UAT_FC_REQ-391_alternative_looks.test.ts` (consultant toolbox + renderer):
  - creating a set yields labelled, ordered copies of the page;
  - a look is listed as a look and never as unreachable (`1c page list`);
  - an existing page joins a set, a set can grow, and a set of another page is refused;
  - looks render for the preview and never for the public site.
- `tests/test_UAT_FC_REQ-391_looks_carousel.test.ts` (real builder in jsdom):
  - looks are absent from the page list and no client-facing string contains "unreachable";
  - Compare looks appears only while a set is on offer;
  - the carousel shows label and n of N, and the arrows move between looks: set order, preloaded neighbour, animated swap, Open in new tab follows, toolbar is looks + width + new tab;
  - Back to your draft returns to the draft frame;
  - Choose this one writes the choice and returns to the page;
  - a chat link opens the set;
  - the comp viewer uses the same carousel without Choose.
- `tests/test_UAT_FC_REQ-391_choosing_a_look.workers.test.ts` (worker routes, real D1/stores):
  - Choose this one replaces the page, records the decision with the set and not-chosen labels, and archives the rest;
  - choosing the "Before" look puts the page back;
  - only a look can be chosen;
  - the consultant's `choose_look` puts the look on the page and records the client's words.

Updated for the superseded behaviour:
- the REQ-248 and REQ-252 page-control UATs (the "not linked from the site" label);
- the REQ-378 viewing-a-comp UAT (the carousel);
- the closed write-set lists in `reconciliation-assistant-control-surface` and REQ-126 (`make_alternatives`);
- the toolbar strip in `reconciliation-builder-toolbar-lifetime` (`compare-looks`).

Regression scope: about 50 node/jsdom builder, surface, priming and render suites, plus 14 workers suites. All green apart from failures that also fail on a clean xgd-working: BUG-48 ×4, BUG-64 ×1, REQ-148 ×2.