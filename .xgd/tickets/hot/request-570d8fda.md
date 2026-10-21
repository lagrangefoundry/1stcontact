---
uid: request-570d8fda
id: REQ-422
type: request
title: 'L1: a shared site header and footer with navigation that knows the site''s
  pages; host checks for missing headers and dead-end pages'
created_by: EPIC-19
created_at: '2026-10-21T18:29:34.512587+00:00'
updated_at: '2026-10-21T21:41:00.737538+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-66f7c2b3
  commits:
  - working_sha: e868abf1b06129e5a52b1da2b25187361601b0f2
    reconcile_sha: null
    main_sha: null
  - working_sha: f879f0e8a4eb1a08b3b00c0fd8ac15730eb17c97
    reconcile_sha: null
    main_sha: null
  version: 0.2.575
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

## Implementation (as landed, REQ-422 free-coded)

### Shared header and footer
- A shared part **is a page** whose `kind` is `header` or `footer` (`pageKindSchema` gains both). It is stored under its own name (`header.json`), so it is its own lease file (REQ-397), is written with the same L1 tools, validated the same way, and is **never served**: `servedPages` (and every "which pages are served" reader) excludes it via one helper, `isServedPage` (`packages/site-schema/src/parts.ts`). The builder preview still renders `header.html` on its own so it can be looked at.
- The site validator allows **at most one** header and one footer; a part cannot be a look, carry `seoMeta`, carry components, or opt out of parts; nothing in `site.nav` may point at a part.
- A web page carries both parts unless it opts out with `shared: { header: false }` / `{ footer: false }` (set by `add_page` / `update_page`). Email pages and parts carry none.
- **Render:** `renderPage` draws each carried part as its own L1 document **beside** the page's root, not spliced into it: `<header data-l1-part="header">` before `.l1-0` and `<footer data-l1-part="footer">` after, wrapper `display: contents` (so a sticky header sticks to the page). The part's classes are prefixed (`header-l1-N`) via a new `prefix` render option, which also suppresses the document reset and paints the part's own background/text colour on its root. So the page's own addresses (`0.n` — edit channel, `set_l1`, layout-check sections) are unchanged. In the edit channel parts are shown `inert` and unstamped (edited on their own page).
- **Ids:** `validateSite` refuses a node id used both by a page and by a part it is drawn with (one HTML document).
- **Security:** structured only — a part is ordinary L1, the menu items are drawn by the renderer from structured entries; labels are escaped and hrefs pass `isSafeHref` like every link.

### Navigation that knows the pages
- **Reuses the existing `site.nav.entries`** (previously validated but never rendered) as the menu's source of truth — no second store. A new L1 leaf node **`nav`** draws it: `{ kind: 'nav', item, gapPx?, align?, collapseBelowPx?, menuLabel?, axes?, type?, …axis groups }`. Its one child is `item`, a text node (no id/link/action/heading) that is the look of every entry; its copy is replaced per entry. Rendered as `<nav aria-label="Main">`, one `<a>` per entry (current page `aria-current="page"`), emitted through the ordinary text path (the renderer remains the sole `<a>` sink).
- **Phone:** below `collapseBelowPx` (default 640; `0` never) the list folds behind a native `<details><summary>Menu</summary>` button — no script.
- **Page list sync:** `add_page` and `copy_page` append the page to the navigation in the same write (opt out with `nav: false`); `update_page` relabels an entry that still carried the old title; `remove_page` drops the page's entries in the same write; `make_alternatives` drops the entry of a page that becomes a look. Creating the site's first header/footer (or `share_section`) seeds an **empty** navigation with the served pages, home first. **This writes `site.json`, so a builder adding/removing/renaming pages needs `site.json` in its scope** (priming says so).
- New op **`set_navigation`** `{ entries: [{page, label?} | {href, label}] }` sets order, labels and visibility in one call; a served page left out is hidden from the menu (not removed).
- **Supersedes REQ-11's `page_rm_blocked_by_nav`:** removing a page the menu names is no longer refused (REFERENTIAL_INTEGRITY); its entries are removed with it. The REQ-11 UAT was rewritten as `test_UAT_FC_REQ-11_page_rm_removes_its_nav_entries`.

### Branding
- `add_page` with `kind: header` seeds the business name (from `config.businessName`) linking home, beside a `nav` node. The wordmark size comes from configuration: `layout-check.json` `brand.wordmarkPx` `{ desktop: 30, phone: 24 }` (a responsive track between them), in the site's `heading` text style when it has one. A footer seeds the name and a centred, never-folding menu.

### Host checks
In-browser, in REQ-415's `LAYOUT_SCRIPT` (both need the business name, which every site page now states as `<meta name="application-name">`; a bare L1 fixture without it is not checked for these two):
- the shared header is measured as its own section `site-header` (footer `site-footer`), and when present it is the page's header for the BUG-238 checks; parts are left out of the content-edge comparison;
- **`no_header`** — the top of the page (the shared header, else the first section) shows neither the business name (matched on its first significant word) nor a logo (img/svg);
- **`name_smaller_than_headings`** — the business name in the top section is smaller than the page's largest H2, or (logo only) the logo is shorter than that heading's cap height (0.7 × size).
On the stored site (`siteStructureFindings` in `edit.ts`, same reachability walk `list_pages` uses — now following links in the parts a page carries and the menu a `nav` draws):
- **`unreachable`** — a served page not reachable from home;
- **`dead_end`** — a served page other than home with no link back home;
- **`leftover_placeholder`** — a page still holding the `placeholder` heading `add_page` seeds.
The host's after-build look (`hostLook`) runs the structure check over **every** served page after any build that wrote pages (a header change is browser-checked on the home page), owes each finding until fixed, and says "THIS BUILD IS NOT DONE … before you say a page is ready or in the menu".

### Teaching
Builder priming (both variants): header/footer are shared pages, never build a header/menu/link home into a page, the menu is a `nav` whose items are the pages, change it with `set_navigation`, replace the `placeholder`, the business name is never smaller than the section headings. Consultant priming (both variants): shared parts and menu, `site.json` in scope for page add/remove/rename and menu changes, how to create a header or `share_section` an existing one on the client's yes, and never claim something is in the menu until the host's look reports no unreachable page or dead end. Delegation-files template names `header.json`/`footer.json` and that page add/remove/rename writes `site.json`.

### Existing sites
New op **`share_section`** `{ page, section, as: header|footer }` moves a page's own top-level section into a new shared part (keeping the page's widths/paint/fonts), removes the same-id section from every other web page (copies), seeds an empty navigation, and is refused when the part exists or the section hosts a component. Nothing is converted automatically.

### Not done / limits
- Capture/fold has no reverse inference of `nav` or shared parts: a captured rendered page folds the menu back to plain links (the round-trip gate's fixtures carry no `nav`). The geometry model estimates a `nav` as one line of its item type.
- A header edited by a builder is browser-checked on the home page only (other pages get the structure check).

### Other UAT adjustments (intent preserved)
- BUG-235's "clean check" fixture is now a coherent site (a shared header listing both pages, no placeholder) — the old fixture is an unreachable/dead-end site, which is now correctly a fault.
- BUG-237 (hidden text) filters out the new brand findings on its bare form page; they are pinned by REQ-422's own UATs.
- REQ-126 / AC1073 op lists gain `set_navigation` and `share_section`.

## Test plan (as landed)
`tests/test_UAT_FC_REQ-422_shared_header_and_navigation.test.ts` (node): header and footer render on every page; opt-out renders without (and back); editing the header changes every page; a new page has both; wordmark sized from configuration; adding/copying a page adds a menu item (current page marked); set_navigation hides/reorders; removing/renaming updates the menu; phone width collapses via native details with no script; second header and a menu entry to a part refused; id shared by page and header refused; menu labels/hrefs inert; share_section converts a page's header section and removes copies; schema refuses a part with shared/seoMeta; structure findings name unreachable, dead end and leftover placeholder; a page in the shared header menu has none; priming carries the rules.
`tests/test_UAT_FC_REQ-422_header_checks.test.ts` (Chromium): 18px header name with 32px H2 → `name_smaller_than_headings` at both widths; 30px name with 28px H2 → none; a page with no name/logo at its top → `no_header`; the shared menu shows links at desktop, only the button at 375px, and opens natively.