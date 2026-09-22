---
uid: request-294aa45b
id: REQ-298
type: request
title: 'Console: a full-surface view with a sites list beside a business detail'
created_by: EPIC-20
created_at: '2026-09-22T20:01:03.576610+00:00'
updated_at: '2026-09-22T20:12:15.909665+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  story_points: 8
  needs_review: false
---

## Why

[[REQ-297]] built the operator console as a **dialog** — a modal panel over a
scrim, opened from an action in the shell header's trailing slot. Its reasoning
about *where the console belongs in the information architecture* was accepted
and stands: the console is not a tab, and the tab strip stays uniformly
business-scoped. What does not stand is the **container**. A modal is for a
thing you glance at and dismiss; this console is a two-panel working surface a
person sits in front of, and a dialog cannot hold a split position, cannot be
worked in at length, and puts a scrim between the operator and everything else.

So the console keeps its entry point and loses its overlay. It becomes a
**full-surface view**: opened by the same header button, it takes over the whole
of the shell's content region, exactly as a tab's panel does, with no scrim and
nothing of the builder showing through behind it.

And the interface inside it is specified here for the first time: every site on
the platform on the left, the selected site's business on the right.

## What supersedes what

REQ-297 is `free_coded` and not yet reconciled. This ticket **explicitly
supersedes** the following of its statements, which must not survive into the
capability matrix:

- The console being a **dialog** — *"an action in the shell header's trailing
  slot, beside the account avatar, opening a dialog"*, and `modal.js` as its
  chrome. Withdrawn. The action stays; what it opens is a full-surface view.
- Its **conditions 2 and 3** — the console's content being a league of tenants
  ordered by cost, with a row that expands in place. The list is now sites, the
  detail is a pane rather than an expansion, and it carries more than spend.
- Its **condition 8**, only insofar as it binds the registry to the *console*.
  The registry survives, re-cast onto the detail pane (§"The registry moves, and
  is not deleted").

Everything else REQ-297 established **stands and is reused unchanged**:

- **Condition 9 survives intact** — the console is not a tab and the tab strip
  remains uniformly business-scoped ([[REQ-179]]). No entry is added to the
  strip. The argument was structural and is accepted; only the container it was
  used to justify is replaced.
- `ownsPlatformBusiness(env, admission)` as the gate, at the chrome and again on
  every route — not `platform_operator`, for the reason `identity.ts` states in
  terms.
- `/api/admin/spend` and `/api/admin/spend/businesses`, their shared period
  parser, absent-means-unbounded, and the 404 for a caller who does not own the
  platform business.
- The spend arithmetic: `report`, `days`, `delegated`, principal and delegate as
  two figures never summed, *nothing, never zero*.
- `/api/businesses` answering `ownsPlatformBusiness`, and `fetchBusinesses`
  carrying that field through to `mountBuilder`.

This is a change of **container and content**, not of meter and not of
information architecture.

## A view, and what that means precisely

The distinction this ticket turns on is not decoration, so it is stated as
behaviour rather than as style:

- **It is not layered over anything.** No backdrop, no scrim, no `z-index` above
  the builder. The content region shows the console *instead of* the tab panels,
  not on top of them.
- **It fills the content region completely** — the full height and width the
  active tab's panel would have had, so the two-panel split inside it gets the
  same room a tab gets and the divider is worth dragging.
- **Escape does not close it.** That is the reflex a transient overlay owes its
  reader, and this is not one. A surface somebody works in for twenty minutes
  must not vanish on a stray keypress, and a person who has just dragged a
  divider and scrolled a detail pane has state to lose.
- **Nothing of the builder is inert behind it**, because nothing of the builder
  is behind it.

### Where it mounts, and the honest cost

The console element is appended into the shell's `<main class="shell-content">`,
and the shell's own panels container is hidden for as long as the console is up
(one attribute on the shell root, one CSS rule).

**This is the second place this app touches shell-internal markup**, and naming
it is the point. The first is the business switcher prepended into `.shell-bar`,
which `app.js` already documents as the one such place because `webui-shell`
offers a trailing `actions` slot and no leading one. There is likewise no
declared slot for a view that replaces the panels, and inventing a helper to
hide that would make two exceptions look like none. So they are a list of
exactly two, each with a comment saying which upstream gap it stands in — and
the day `webui-shell` grows either slot, each is a one-line change.

### Getting out of it

**The tab strip stays live, and clicking any tab dismisses the console and shows
that tab.** That is what "behaves like a tab" has to mean at the seam where it
is testable: the strip is the builder's primary navigation and it must not stop
working because a view is open.

While the console is up, **no tab reads as selected**. The shell keeps an active
tab internally — it has no concept of none — and leaving that tab highlighted
while its panel is not on screen would be the surface telling the operator they
are looking at something they are not. The selected styling is suppressed for as
long as the console is up, through the same root attribute that hides the
panels.

The console also carries its own **Close** in its header, returning to the tab
that was active when it opened. Two ways out, and they are not redundant: one is
navigation to somewhere else, the other is dismissal back to where you were.

**The header action is marked active while the console is up**, and pressing it
again does nothing rather than mounting a second console.

### Which surface is recorded

`postSurface` is **not called when the console opens or closes**.
`/api/activity/surface` is business-scoped ([[REQ-235]] §5), and recording
`console` against whichever business happened to be open would put a
cross-business surface in one business's activity — a row that is not false so
much as meaningless. Dismissing *to another tab* posts that tab's surface
through the shell's ordinary `onTabChange`, unchanged; dismissing back to the
tab that was already active posts nothing, because as far as the record is
concerned nothing moved.

### The business switcher

It is prepended into `.shell-bar` and applies to every tab. It applies to
nothing on the console, which is about every business at once, so it is
**disabled while the console is up** and restored when it closes. *A control
that is present and silently ignored reads as a bug* is REQ-179's own objection
and it does not stop being true here.

## The interface

A two-panel list/detail, mounted with `@lagrangefoundry/webui-list-detail` in
`no-tab` mode — the same component the Library and People tabs already use, and
for the same reason: this is a master/detail, and a second implementation of one
would diverge from theirs on divider behaviour, collapse and split persistence
the first time any of those is touched. Split position persists through
`shell.storage(...)` like the others.

### Left: every site on the platform

One row per site, across every business — not one row per business. A business
with two sites is two rows, because the operator's question starts from
something they can see published.

Each row carries the site, the business that owns it, and that business's cost
over the console's period.

**Order is cost descending, dearest business first**, with sites of the same
business adjacent, and every business with no measured spend after those that
have some, ordered by name. This is the one thing the instruction did not
specify, and it is decided this way because *which tenant is costing us money*
is the question the console was built for and the only ordering that answers it
by being looked at. An alphabetical directory would answer nothing and would
have to grow a sort control on its first day.

A site whose business has **no measured turns** in the period is present with no
cost — absent, not zero, on screen as in the data. A site is never dropped for
having no spend: the list is the platform's sites, and a list that quietly
omitted the quiet ones would be read as complete.

### Right: the selected site's business

Three things, in this order:

1. **The account** — the business, its owner account, and that account's status.
   `tenants.owner_account_id` names it (`NULL` is the platform business itself
   and says so rather than rendering blank).
2. **A link to the published site** — the site's canonical public address, as a
   link that opens in a new browser tab. Resolved through `hostname.ts`, which
   is the one place `site_domains` is read; `addressForLinks` already decides
   which of several addresses a link should use. A site with **no** public
   address shows that it has none — a sentence, not an empty anchor and not a
   dead link. This is the same fact `POST /api/publish` refuses on with
   `NO_PUBLIC_ADDRESS`, so the console and the refusal cannot disagree about
   whether a site is reachable.
3. **Cost details for that business** — REQ-297's per-day figures and its
   principal-against-delegate split, over the console's period, from
   `/api/admin/spend?business=…`. Unchanged arithmetic, unchanged wire, rendered
   into a pane instead of an expansion.

With no row selected the pane says so. It does not pick a row for the operator:
the first row is the dearest tenant, and opening somebody's spending because
nothing else was chosen is a decision the surface should not make on its own.

### The period

Unchanged from REQ-297: a parameter, defaulting to 30 days, declared in
`config.js`, changeable on the surface. It governs both the costs on the rows
and the detail. Changing it re-reads both, and the list re-orders — which is the
point of it being one period rather than two.

## The registry moves, and is not deleted

REQ-297's argument for a registry was sound and is kept, at the place it now
applies. The **detail pane** composes registered sections — account, published
address, cost — each `{id, label, mount(container)}`, each mounting into a block
of its own, and **a section that throws is reported in its own block while the
rest of the pane renders**. That is REQ-297's failure-isolation rule, moved from
console-to-control to pane-to-section, and it matters more here than it did
there: a business whose spend read fails must still show the operator who owns
it and where the site is.

The console view itself knows nothing about what a section shows, and a pane
with no sections registered renders as an empty pane rather than a broken one —
the same assertion REQ-297 made of the console, at the seam that still exists.

**The modal chrome goes.** The console's use of `modal.js` is deleted, not left
beside the view behind a flag: two ways to open one surface is the complexity
this project's standards name outright, and git is the archive. `modal.js`
itself stays — it has other callers, and this ticket is not about them.

## The route the list needs

`GET /api/admin/sites` — one row per site on the platform: site id, business id
and name, owner account id/name/status, canonical public address or none, and
`created_at`. Same gate, same 404, same reasoning as
`/api/admin/spend/businesses`: a directory of every customer's sites is a
platform question, not a question about the business the request resolved to.

It is **not** merged into `/api/admin/spend/businesses`. That route answers the
meter and is ordered by it; a site with no spend must appear here, and adding
optional non-meter rows to a meter route is how one route acquires two answers.
The client joins the two by business id and does the ordering, because the
ordering is a property of the surface and the period is the surface's.

A site whose business has no `tenants` row is present with no business name, for
the reason REQ-297 gave about the league: an inner join would drop exactly the
rows worth noticing.

## What must be true when this is done

1. A session owning the platform business sees the console action beside the
   account avatar; every other session sees no action, and each route behind the
   console refuses that caller in its own right with the ordinary 404.
2. Pressing the action opens the console as a **full-surface view**: it fills
   the shell's content region, the tab panels are not shown behind it, there is
   no scrim, and no dialog form of the console remains in the codebase.
3. **No entry is added to the tab strip**, which remains uniformly
   business-scoped.
4. While the console is up, no tab reads as selected; clicking any tab dismisses
   the console and shows that tab; the console's own Close returns to the tab
   that was active when it opened; **Escape does not close it**.
5. The business switcher is disabled while the console is up and restored when
   it closes. No surface is posted for opening or closing the console.
6. The console shows a two-panel list/detail: every site on the platform on the
   left, one selected site's business on the right.
7. Rows are ordered by their business's cost over the period, dearest first,
   sites of one business adjacent, businesses with no measured spend last.
8. A site whose business has no measured turns is listed with no cost rather
   than with zero, and is never omitted.
9. Selecting a row shows the owning account, a link to the published site, and
   the business's cost detail — the per-day figures and the principal/delegated
   split, matching what `/api/admin/spend` reports for the same business and
   period.
10. A site with no public address says so; no empty or dead link is rendered.
11. A detail section that fails is reported in its own block and the other
    sections still render.
12. The period defaults to 30 days, is changeable on the surface, and governs
    both the row costs and the detail.

## Not in scope

Writing anything. Opening a listed business into the builder's tabs (the
operator switches business the ordinary way; a jump is a later ticket if it is
wanted). A second console view. Charts. Export. Caps or enforcement. Anything
about a site other than its business, its address and that business's spend.

## Depends on

REQ-292 and REQ-293 for the meter, and REQ-297's routes and gate, which this
reuses rather than rebuilds. REQ-297's commits are on `xgd-working`; this work
is written against them.

## Test plan

- `tests/test_UAT_FC_REQ-298_console_view.test.ts` (jsdom) — the action's
  presence for an owner and absence otherwise; opening it filling the content
  region with the tab panels hidden and no scrim present; the tab strip carrying
  no selected tab while it is up; a tab click dismissing it to that tab; Close
  returning to the previously active tab; Escape **not** closing it; a second
  press of the action not mounting a second console; the tab strip gaining no
  entry; the switcher disabled and restored; no surface posted on open or close.
- `tests/test_UAT_FC_REQ-298_console_panes.test.ts` (jsdom) — the list's order
  including the no-spend tail, a site with no cost still listed, the
  empty-detail state, the three detail sections, a section that throws leaving
  the others rendered, and the period default moving both the order and the
  detail.
- `tests/test_UAT_FC_REQ-298_admin_sites.workers.test.ts` — `/api/admin/sites`
  against a real D1 in workerd through `route()` with a real admission: the 404
  for a non-owner, one row per site, the address resolved through `hostname.ts`,
  a site with no address, and a site whose business row is missing still present
  with no name.
