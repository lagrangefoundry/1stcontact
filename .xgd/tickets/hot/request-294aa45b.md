---
uid: request-294aa45b
id: REQ-298
type: request
title: 'Console: a full-surface view with a sites list beside a business detail'
created_by: EPIC-20
created_at: '2026-09-22T20:01:03.576610+00:00'
updated_at: '2026-09-24T18:40:57.675323+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  story_points: 9
  needs_review: false
  chat_comment: comment-be83c49e
  commits:
  - 0a0465bd79ff80020af1a700bc4a1d1173d118c5
  - 32a2667dc6e9ed6d12ff8e8e25ed1fcacb4bbcd9
  version: 0.2.325
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
both gaps are now filed against the component itself: `lagrange-framework`
**REQ-173** (a `leading` slot in the bar) and **REQ-174** (`openView` /
`closeView`, which is also the only place "no tab reads as selected" can be
stated, since `tabs.js` has no concept of none active). Neither blocks this
ticket; the day either lands, the touch it stands in for becomes a one-line
change.

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


## What was built, and where it differs from the text above

The sections above are the spec as agreed and are unchanged. This section is the
implementation record: the decisions taken while building it, and — named
explicitly, because reconciliation reads this body as authoritative — the two
places where a statement above turned out to be false about the codebase.

### Three statements above are superseded by this section

1. **"This is the second place this app touches shell-internal markup."** Not
   quite. `app.js`'s `blockTabs`, `blockForPublish` and `blockEverything` all
   already `querySelector('.shell-panels')`. The true statement, and the one the
   code comment makes, is narrower: there are exactly two places that **insert a
   surface** into the shell's internals — the business switcher prepended into
   `.shell-bar`, and the console appended into `.shell-content`. The block
   helpers only set `inert` and place a banner beside the panels; they add no
   surface and survive any markup change that keeps the class name.

2. **"A site whose business has no `tenants` row is present with no business
   name."** Not constructible. `sites.tenant_id` is a foreign key with
   `ON DELETE CASCADE`, and D1 enforces it — a deleted business takes its sites
   with it, so the state this sentence describes cannot exist. The `LEFT JOIN`
   to `tenants` stays, as defence against that constraint being relaxed rather
   than against today's data, and the ticket's *intent* — an inner join would
   drop exactly the row worth noticing — is asserted at the join where it **is**
   reachable: `tenants.owner_account_id` carries no foreign key (the pair would
   be a cycle), so a business can name an account row that no longer answers.
   The UAT constructs that, and a second case covers the other absence: the
   platform business, whose `owner_account_id` is `NULL` because it is nobody's
   customer. The two are worded differently on screen, because a blank cell
   would make an ordinary fact and a fault indistinguishable.

3. **"The shell's own panels container is hidden … (one attribute on the
   shell root, one CSS rule)."** The attribute is right; the CSS rule is not,
   and it did not work. `.builder-shell--console .shell-panels { display: none }`
   is two classes, and it is up against `shell.css`'s own eight-class `:has()`
   fill-height chain setting `display: flex` on that same element. Specificity
   decides it and the console loses; source order never enters into it. Every
   tab in this builder is a fill tab, so the losing case was the only case —
   the panels stayed on screen and the console took whatever vertical room was
   left, which is what "it occupies the bottom half of the screen" was. **The
   panels are hidden by `console.js`, on an inline style on the element**, which
   no selector can out-specify, which needs no knowledge of the rule it
   displaces, and which — like the tab's selected styling and the switcher
   before it — restores to exactly what it found rather than to a guess.
   `builder.css` carries no rule that tries, and a UAT asserts its absence,
   because a rule reintroduced there would look like it worked without working.

### Decisions taken while building

**A section is handed the selection, not just its element.** The registry entry
is `{id, label, mount(container, selection)}` rather than `mount(container)`.
REQ-297's controls mounted once and closed over their own subject; a section is
re-mounted every time the operator picks a different row, so the subject cannot
be closed over — it has to arrive. `selection` is `{site, period}`: which row,
and over what window.

**No tab reads as selected — done through the shell's own mechanism, not through
the root class.** The root class (`builder-shell--console`, the same form as the
existing `builder-shell--no-business` and `builder-shell--publishing`) hides the
panels, in one CSS rule, as specified. Suppressing the tab's *selected styling*
that way would have meant mirroring `.shell-tab.is-active` under two different
`data-tabstyle` values and silently ceasing to mirror them the day upstream adds
a third. So the console removes exactly what the shell sets — the `is-active`
class and `aria-selected` — and restores exactly what it found. That also makes
a **screen reader** told the truth rather than left with a tab claiming to be
current while its panel is off screen, which the styling-only approach could not
do.

**The header action carries `aria-pressed` while the view is up**, because the
way in has genuinely become a toggle.

**Ordering, stated precisely.** The ranked head is the league's *own* order,
read as a position rather than re-derived from its figures — `tenantSpendLeague`
already decides what `null` means in a ranking of money and that decision belongs
beside the arithmetic. The tail is every business the league does not mention,
ordered by name. Within one business the order is the route's, oldest site first,
because nothing about a site other than its business is a reason to rank it. When
the meter cannot be read at all, every row is in the tail — that is the rule, not
a fallback, so there is no second ordering to keep in step.

**The two reads fail differently, because they matter differently.** A failing
`/api/admin/sites` empties the list and says why: without it there are no rows. A
failing `/api/admin/spend/businesses` leaves the list standing with no cost beside
any row and a notice — an operator who came to see what we have published should
not be shown nothing because the meter was unavailable.

**`GET /api/admin/sites` lists `kind = 'site'` and not every row in the table.** A
portal is authored under the same business and is not what a public hostname
reaches — `siteOf` already draws that line. Listing portals would put a permanent
*no public address* row beside every business and bury the one signal that column
exists to carry: the customer site that was built and never published.

**The three headline figures came with the pane.** REQ-297's league read cost,
engaged hours and cost per engaged hour across every tenant; with the ranking now
carried by the list, the same three facts about one business sit at the top of its
detail. Dropping them would have made the re-housing a loss of information rather
than a change of container.

**`GET /api/admin/sites` takes no period, and an unknown query changes no
answer.** Its sibling `/api/admin/spend/businesses` takes one because the meter
is measured over a window; nothing this route answers is. A site exists, belongs
to somebody, and is reachable or not. So a `from`/`to` here would either be a
second period the console could believe something different about than the one
governing its rows, or a parameter accepted and ignored — which is a parameter
that lies. It is neither: the handler reads no query at all, and a UAT asserts
that by asking for a window and getting back exactly the unwindowed answer. It
is `GET` and nothing else, for the reason the meter routes give — a site is
created by provisioning and an address by `claimHostname`, both elsewhere and
both with consequences a read has none of.

**The console closes when the builder is torn down.** It hides the shell's
panels and suppresses the tab strip's selection, so a teardown that left it up
would leave the builder's own navigation looking broken with nothing on screen
to explain it. It goes at the same point, and for the same reason, as the
no-address modal already does.

**`switcher.setEnabled(on)` remembers what it found.** An account with nothing
selectable already has a permanently disabled switcher (REQ-179 reopen); naively
re-enabling on close would hand that account a working control onto businesses it
may not enter. A UAT covers it.

**The split position persists under `STORAGE_KEYS.console`** — prefixed with the
console's own stable id, exactly as each tab's state is prefixed with its tab's.

### The second pass: what a browser showed and jsdom could not

The console landed, was opened, and was wrong in three ways at once — it
occupied the bottom half of the region, its text rendered at the user agent's
size in a builder that is 13px throughout, and the cost figures could not be
matched to the headings they belonged under. Every case in the first pass
passed against it, because **jsdom lays nothing out and applies no stylesheet**:
a surface can be structurally exactly as specified and still be unusable, and
nothing in a DOM assertion can tell you which. So the fixes below are asserted
where the fact actually lives — in the stylesheet's text, or on the element's
own inline style — and were checked against a real Chromium rendering the
shipped markup and sheet.

**The region, and why the console declares its own height chain.** The
specificity fault is recorded above as the third superseded statement. What
goes with it: filling the content region needs that region to be a shrinkable
column of definite height, and the shell supplies exactly that — but only while
the active tab is a *fill* tab. That is true of all four of this builder's tabs
and it is not a property the console should rest on, because it makes "the
console fills the region" depend on which tab happened to be open behind it. So
the sheet declares the chain under the console's own root marker, and the
view's height is its own fact.

**The type size is declared at the root of the view.** Nothing between `html`
and this view set one. `webui-list-detail` sizes its own rows, but the console
replaces every row through `renderRow`, so that size does not reach the text
that is actually on screen — and the detail pane, which the component does not
render at all, had no size from anywhere. One declaration at the root of the
view, taking the builder's own control font size; the detail pane's metrics are
the People tab's detail pane's exactly, because two panes of the same kind in
the same builder reading differently is a defect with no upside.

**Every column in the cost section is named.** A day row is a date and two
numbers, and a model row a name and two more; the grid exists so figures can be
read *down* a column, and without a heading over each column nothing on screen
says which number is money and which is time. The day table and the model table
each carry a heading row **sharing the row's own class**, which is what keeps
the headings over the columns they name rather than merely above them — a UAT
asserts the pairing, since a heading in a grid of its own is exactly the fault
being fixed. With that, the rest of the section's illegibility resolves into
ordinary layout: each half of the principal/delegated split is a bordered box
so the two sets of figures cannot be read as one, the sentence about unpriced
usage moves out of the row of headline figures it was being read as a fourth
member of, both tables are width-bounded rather than stretching a three-column
grid across a wide pane, and the model rows get a two-column grid of their own
instead of borrowing the day row's and leaving a third of every row empty.

### What changed in REQ-297's own suite

`tests/test_UAT_FC_REQ-297_operator_console.test.ts` lost the cases asserting the
dialog, the league table and the expanding row — the three things this ticket
supersedes — and kept the gate, the `ownsPlatformBusiness` path from the wire to
the chrome, the two meter path literals, and the money/window formatters. The
deleted claims are not gone from the matrix: the container is asserted by
`test_UAT_FC_REQ-298_console_view` and the content by
`test_UAT_FC_REQ-298_console_panes`, both against the shipped modules.
`tests/test_UAT_FC_REQ-297_tenant_cost.workers.test.ts` is untouched — every
route it proves survives unchanged.

### Files

- `apps/control-app/src/directory.ts` — **new.** `platformSites(env)`: the join
  over `sites`/`tenants`/`accounts`, with each site's address resolved through
  `hostname.ts` as a fan-out.
- `apps/control-app/src/router.ts` — `ADMIN_SITES_PATH` and its handler.
- `apps/control-app/src/builder/console.js` — rewritten: the full-surface view.
  `modal.js` is no longer imported; no key is bound, which is the whole of
  "Escape does not close it". It also hides and restores the shell's panels
  on their own inline style, the one declaration no sheet can out-specify.
- `apps/control-app/src/builder/platform-sites.js` — **new.** The two-panel body:
  the list, the ordering, and the detail pane with its section registry, plus the
  account and address sections.
- `apps/control-app/src/builder/tenant-cost.js` — reduced from the league control
  to the cost section; `dollars`, `hours` and `periodOfDays` are unchanged and are
  now shared with the list.
- `apps/control-app/src/builder/business.js` — `setEnabled` on the switcher.
- `apps/control-app/src/builder/app.js` — `consoleSections` replaces
  `consoleControls`; `openConsole` is the latch and owns the switcher hooks.
- `apps/control-app/src/builder/api.js` — `fetchPlatformSites`.
- `apps/control-app/src/builder/config.js` — the console's constants moved above
  `STORAGE_KEYS` (which now derives a key from the console's id), plus the view's
  and the pane's own labels; the league table's vocabulary removed.
- `apps/control-app/src/builder/builder.css` — the view's rules, the two panels',
  and the tenant-cost section's; the console's entry in the modal-panel `:has()`
  exclusion list removed, since it is no longer a dialog. The view declares its own
  height chain and its own type size, and deliberately carries **no** rule
  hiding `.shell-panels`.

-