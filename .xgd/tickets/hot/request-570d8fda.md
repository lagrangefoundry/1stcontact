---
uid: request-570d8fda
id: REQ-422
type: request
title: 'L1: a shared site header and footer with navigation that knows the site''s
  pages; host checks for missing headers and dead-end pages'
created_by: EPIC-19
created_at: '2026-10-21T18:29:34.512587+00:00'
updated_at: '2026-10-21T18:55:16.563738+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Why (Ariel's AR Welding run, 2026-10-21; operator)

> With the kind of sites we are building there will be a common header (and
> often footer) with consistent links and branding — that should be a first
> class concept in L1.
>
> The home page has no title or banner … this is a big gap on this site. It
> looks super odd to me.

What the draft actually held after the consultant created an "Art & commissions"
page and reported "**Art** is now in the menu":
- **The home page has no header, title or menu.** Its only links are one button
  in the art section (`/art`) and two `#contact` anchors.
- **The art page has no header and no navigation** — no way back to home — plus
  an empty `placeholder` section left from its creation.
- The consultant reported a menu that doesn't exist.

L1 has links (REQ-106) but no notion of site navigation: every page carries its
own sections, so nothing is shared, adding a page updates nothing elsewhere, and
a builder scoped to one page can't keep navigation consistent across others.
BUG-238's check sizes a header logo but never notices there is no header.

## What changes

### 1. Shared site header and footer in L1
- A site declares a **header** and optionally a **footer**, each an L1 subtree
  stored once at site level (its own file, per EPIC-24's shared-section idea) and
  rendered on every page above/below the page's own sections. Editing it once
  changes every page.
- A page may opt out (e.g. a landing page) explicitly; the default is to carry
  both. A new page is created with them in place, so it can never be a dead end.
- Validator, renderer and capture/fold support it; security invariants hold
  (structured only). Locks (REQ-397) treat the header and footer as their own
  scope.

### 2. Navigation that knows the site's pages
- The header (and footer, if wanted) contains a **navigation** node whose items
  come from the site's page list: label, order and visibility per page, stored
  with the site. Adding a page adds it to the navigation by default; the
  consultant can hide or reorder entries. Removing or renaming a page updates the
  navigation. Links are emitted by the renderer (sole `<a>` sink).
- Responsive behaviour is declared: at phone width the navigation collapses (a
  menu button) without script beyond the framework's existing behaviour bundle.

### 3. Branding in the header
- The header carries the business's **name and/or logo** linking to home, sized
  per BUG-238's thresholds by default.

### 4. Host checks, from now (the safety net)
After any build that creates or changes pages, REQ-415's check also reports, and
a finding means the build isn't done:
- **no header** — a page with no business name or logo at its top;
- **unreachable page** — a page not reachable from home by links;
- **dead end** — a page with no link back to home;
- **leftover placeholder** — an empty section left from page creation.
This catches today's sites before item 1 lands, and any opt-out page after.

### 5. Teaching
Builders and the consultant: new pages use the shared header/footer; navigation
changes go through the navigation, not hand-made links; the consultant states
navigation changes only after the check confirms them (no "it's in the menu"
unless it is).

### 6. Existing sites
A page's own top section that serves as a header is converted to the shared
header when next edited (one-off, with the consultant confirming the choice);
nothing is forced.

## Test plan
- Schema/render: a site header and footer render on every page; a page that opts
  out renders without them; editing the header changes every page.
- Adding a page adds a navigation item; hiding/reordering works; removing a page
  removes its item; phone width collapses the navigation.
- A new page created through the builder has the shared header and footer.
- Layout check fixtures: a page without name/logo at the top, a page unreachable
  from home, a page with no link home, and an empty placeholder section each
  produce their finding.
- Priming carries the navigation rules.


## 7. The business name is never smaller than the page's headings (operator, 2026-10-21)

> I constantly see the main title of the site smaller than our heading text — is that right?

No. A hero headline (a tagline) may be larger than the header's wordmark — that is a common, legitimate pattern — but **the business name must never be smaller than the section headings** on the same page. BUG-238's check only compares the name with the navigation links (`nameOverNav` 1.25), so a name smaller than every H2 passes.

- **Header wordmark default:** at least ~24px on phone and ~28–32px on desktop, in the brand's display face and weight (configuration, not constants).
- **Home page first screen:** the business name appears prominently — either as the hero heading itself, or in the header at the size above with the hero headline supporting it.
- **Layout check finding `name_smaller_than_headings`:** the business name (header wordmark, or logo's rendered height compared with heading cap height) is smaller than any section heading (H2) on the page, at desktop or phone. A finding means the build isn't done (REQ-415), and it applies to today's pages as well as after the shared header lands.
- Test: a page whose header name is 18px with 32px H2s produces the finding; a 30px name with 28px H2s does not.