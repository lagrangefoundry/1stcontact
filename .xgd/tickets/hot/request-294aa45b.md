---
uid: request-294aa45b
id: REQ-298
type: request
title: 'Console: a cross-business tab with a sites list beside a business detail'
created_by: EPIC-20
created_at: '2026-09-22T20:01:03.576610+00:00'
updated_at: '2026-09-22T20:01:03.576610+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  story_points: 8
  needs_review: false
---

## Why

[[REQ-297]] built the operator console as a **dialog** opened from the header's
trailing slot, and argued at length that it must not be a tab. That argument is
overruled here, by the operator, deliberately and in the knowledge of what it
cost to make: the console is going to be a complex, long-lived working surface —
a list of every site on the platform beside a detail view of one — and a dialog
is the wrong container for a surface somebody works in rather than glances at.
A modal cannot be left open beside the thing it informs, cannot hold a split
position, and puts every future control behind a scrim.

So the console becomes a **tab**, and the interface inside it is specified here
for the first time. Both changes supersede REQ-297; neither is a refinement of
it.

## What supersedes what

REQ-297 is `free_coded` and not yet reconciled. This ticket **explicitly
supersedes** the following of its statements, which must not survive into the
capability matrix:

- *"It is not a tab"* and its condition 9 — *the console is not a tab, and the
  tab strip remains uniformly business-scoped*. Both are withdrawn. The tab
  strip gains exactly one entry that is not business-scoped, and §"The one
  consequence, answered" below says what happens to the switcher instead of
  leaving it present and ignored.
- Its conditions 2 and 3 — the console's content being a league of tenants
  ordered by cost, with a row that expands in place. The list is now sites, the
  detail is a pane rather than an expansion, and it carries more than spend.
- Its condition 8, insofar as it fixes the registry to the *console*. The
  registry survives, re-cast onto the detail pane (§"The registry moves, and is
  not deleted").

Everything else REQ-297 established **stands and is reused unchanged**:

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

This is a change of **surface**, not of meter.

## The tab

`CONSOLE_TAB` joins `TABS` in `config.js`, **and only for a session that owns
the platform business**. `webui-shell` fixes its tab list at mount and offers no
`addTab`, so the conditional is in the array the app builds — which is the right
place anyway: a tab that exists and refuses is a tab that tells every other
operator the console is there.

The header action REQ-297 built **stays exactly where it is**, beside the
account avatar, and changes only what it does: it calls
`shell.setActiveTab(CONSOLE_TAB.id)` instead of opening a dialog. `consoleActions`
keeps its shape — a list, empty for a session that does not own the platform
business — so "present" and "absent" remain one expression at the call site.

The tab sits **last** in the strip, after Settings. It is the one entry that is
not about the open business, and putting it at the end keeps the four
business-scoped tabs contiguous.

### The one consequence, answered

The business switcher is prepended into `.shell-bar` and applies to every tab.
On the console tab it applies to nothing — and *a control that is present and
silently ignored reads as a bug* is REQ-179's own objection, which does not stop
being true because the decision went the other way.

So the switcher is **disabled while the console tab is active** and restored on
leaving it, through the shell's own `onTabChange` seam. It is visibly
inapplicable rather than quietly inapplicable, which is the difference between an
answered consequence and an unanswered one.

`postSurface` is **not called for the console tab**. `/api/activity/surface` is
business-scoped, and recording `console` against whichever business happened to
be open would put a cross-business surface in one business's activity — a row
that is not false so much as meaningless. The other four tabs post as before.

## The interface

A two-panel list/detail, mounted with `@lagrangefoundry/webui-list-detail` in
`no-tab` mode — the same component the Library and People tabs already use, and
the same reason: this is a master/detail, and a second implementation of one
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
   link that opens in a new tab. Resolved through `hostname.ts`, which is the
   one place `site_domains` is read; `addressForLinks` already decides which of
   several addresses a link should use. A site with **no** public address shows
   that it has none — a sentence, not an empty anchor and not a dead link. This
   is the same fact `POST /api/publish` refuses on with `NO_PUBLIC_ADDRESS`, so
   the console and the refusal cannot disagree about whether a site is reachable.
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

The console tab itself knows nothing about what a section shows, and a pane with
no sections registered renders as an empty pane rather than a broken one — the
same assertion REQ-297 made of the console, at the seam that still exists.

**The dialog goes.** `openOperatorConsole` and the console's modal chrome are
deleted, not left beside the tab behind a flag: two ways to open one surface is
the complexity this project's standards name outright, and git is the archive.

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

1. A session owning the platform business sees a Console **tab** in the strip;
   every other session sees no such tab, and each route behind it refuses that
   caller in its own right with the ordinary 404.
2. The header action beside the account avatar activates that tab. It does not
   open a dialog, and no dialog form of the console remains in the codebase.
3. The console tab shows a two-panel list/detail: every site on the platform on
   the left, one selected site's business on the right.
4. Rows are ordered by their business's cost over the period, dearest first,
   sites of one business adjacent, businesses with no measured spend last.
5. A site whose business has no measured turns is listed with no cost rather
   than with zero, and is never omitted.
6. Selecting a row shows the owning account, a link to the published site, and
   the business's cost detail — the per-day figures and the principal/delegated
   split, matching what `/api/admin/spend` reports for the same business and
   period.
7. A site with no public address says so; no empty or dead link is rendered.
8. A detail section that fails is reported in its own block and the other
   sections still render.
9. While the console tab is active the business switcher is disabled, and it is
   restored on leaving the tab. No surface is posted for the console tab.
10. The period defaults to 30 days, is changeable on the surface, and governs
    both the row costs and the detail.

## Not in scope

Writing anything. Opening a listed business into the other tabs (the operator
switches business the ordinary way; a jump is a later ticket if it is wanted).
Charts. Export. Caps or enforcement. Anything about a site other than its
business, its address and that business's spend.

## Depends on

REQ-292 and REQ-293 for the meter, and REQ-297's routes and gate, which this
reuses rather than rebuilds. REQ-297's commits are on `xgd-working`; this work
is written against them.

## Test plan

- `tests/test_UAT_FC_<TICKET-ID>_console_tab.test.ts` (jsdom) — the tab's
  presence for an owner and absence otherwise; the header action activating it
  rather than opening a dialog; the switcher disabled on the console tab and
  restored on leaving; no surface posted for it; the list's order including the
  no-spend tail; the empty-detail state; the three detail sections; a section
  that throws leaving the others rendered; the period default moving both the
  order and the detail.
- `tests/test_UAT_FC_<TICKET-ID>_admin_sites.workers.test.ts` — `/api/admin/sites`
  against a real D1 in workerd through `route()` with a real admission: the 404
  for a non-owner, one row per site, the address resolved through `hostname.ts`,
  a site with no address, and a site whose business row is missing still present
  with no name.
