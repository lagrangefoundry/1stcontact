---
uid: request-10200dc8
id: REQ-248
type: request
title: Every page is reachable from the control bar, and an unlinked one says so
created_by: EPIC-10
created_at: '2026-09-14T21:35:41.787381+00:00'
updated_at: '2026-09-15T00:12:25.298791+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-209f66e9
  commits:
  - working_sha: 2bb86eb94d055757bf76356fea1c8be9a3919e88
    reconcile_sha: null
    main_sha: null
  version: 0.2.200
  story_points: 3
---

# Every page is reachable from the control bar, and an unlinked one says so

The builder's control bar gains a page control beside the panel one, listing every page the
site has — and marking the ones no navigation entry points at, which are exactly the pages
nothing else can reach.

## 1. What is true today

**A page is reached by clicking a link to it.** The site tab hosts a render of the site, and
moving between pages means using the site's own navigation inside that render. There is no
other way to change which page the tab is showing.

**So a page nothing links to cannot be opened at all.** Not hidden, not awkward — unreachable.
The operator can see it in no list and click it from nowhere, and neither can the assistant
point them at it.

**"Hidden" is not a state anything records, and does not need to become one.** A page is
unreachable precisely because no entry in the site's `navigation` settings names its path.
`list_pages` already returns every page regardless of what links to it, so what this needs
already exists and is simply not shown anywhere.

**The control this wants already has a shape in the same file.** `panelsAction` is a label and
a select in the toolbar that lists what the current page offers, hides itself when there is
nothing to choose, and keeps itself honest against the carry — *"assign, then read back: ...
taking the value FROM the select rather than from what we asked for is what keeps the control
and the carry from disagreeing."* That discipline is the hard part of this and is already
written.

## 2. The change: a page control, and a mark on the unlinked ones

A `Page` control sits beside `Panel` in the control bar and lists every page of the site.
Choosing one shows it. It is a select rather than a link per page: the strip already carries
three buttons and a select, and a link per page stops fitting at about five.

**A page no navigation entry points at is marked as such** — named, and said to be outside the
navigation. That mark is the point of the feature rather than a decoration on it. An
unreferenced page is either deliberate, as a gated landing page is, or a mistake nobody has
noticed yet, and the two are indistinguishable today. The control is where that becomes
visible, and it costs one derived answer: is this page's path among the navigation entries.

**It is an addition to navigating by clicking, not a replacement.** Both move the tab, so both
must agree about where it is: choosing a page moves the render, and following a link inside
the render moves the control.

## 3. Why this is needed before the thing it serves

[[REQ-247]] makes the copy of an outgoing email a page that is deliberately in no navigation and
deliberately not routable. Those pages are the extreme case of the state described in §1: they
are not merely unlinked, they can never be linked. Without this control they would be created,
listed by the assistant, and openable by nobody — so the work that makes them cannot be
exercised until this exists.

## 4. What this does not touch

**Navigation itself is unchanged.** This reports what the navigation does and does not name; it
does not add an entry, remove one, or offer to.

**View, Edit and Colors are unchanged** and go on acting on whichever page is shown.

**The builder's own address is out of scope.** A URL that named the open page would let the
assistant hand the operator a link and let a reload keep their place, and it is a separate
change from this one.

## 5. Acceptance criteria

1. Every page of the site can be opened from the control bar, including one that no
   navigation entry points at.
2. A page outside the navigation is shown as such, by name, and one inside it is not marked.
3. Choosing a page shows it, in View and in Edit alike, and the current mode is kept.
4. Following a link inside the render moves the control to name the page now shown.
5. The control and the render never disagree about which page is open, including after a
   page the control named is deleted or renamed.
6. A page added while the tab is open can be chosen without a reload.
7. A site with a single page still shows the control, naming that page. It answers *where am
   I* as well as *where else could I be*, and a control that vanished at one page would
   answer neither.
8. A page with no title is listed by something an operator can recognise rather than by an
   empty row.
9. The order pages are listed in is stable between openings.
## 6. What "outside the navigation" turned out to mean

§1 states the rule as *"no entry in the site's `navigation` settings names its path"*, and
the code does not bear that out. All three site definitions in `storage/sites/` carry
`nav: {pattern: 'top-tabs', entries: []}`, and nothing reads `site.nav` at render time at
all: navigation on these sites is authored as ordinary L1 links — `link: {href}`, a role any
subtree may take. A control deriving its mark from `nav.entries` alone would mark every page
of every existing site, and a mark that is on everything is a mark on nothing.

**So the derivation is what §1 actually means — *nothing can reach it* — with nav entries
counted as one way in among others.** A page is **reachable** when a reader could arrive at
it: the home page is, because the channel root serves it; any other page is when a page
already reachable links to it, or when a `nav` entry names it. Nav is site-wide chrome rather
than one page's content, so an entry naming a page reaches it from everywhere, which is why
it counts as a link from the front door.

**It is reachability and not an incoming-link count.** Two pages that link only to each other
are linked and still unreachable, and a control calling them reachable would be answering a
question nobody asked.

**A link resolves the way the renderer serves it.** A bare fragment addresses the document it
sits in; a scheme or protocol-relative authority is somebody else's to serve; `''` and
`index` are the home page's own aliases; an extensionless path is the sibling `.html`
(REQ-113); query and fragment are stripped before comparison. The scan errs toward
*reachable*: anything at an `href` key counts, because a link we failed to see would mark a
reachable page unreachable — the control telling the operator something false about their own
site — while a string we counted that was never a link merely withholds a mark.

The mark's wording follows the derivation: an unreachable page is listed as
`<name> — unreachable`, and a reachable one carries no mark.

## 7. Where the answer comes from

**`editPageList` carries it.** The listing already returned every page; it now returns
`reachable` per row, derived beside the definition it reads. The assistant's `list_pages` and
the builder read the same field from the same derivation, so the chrome and the conversation
cannot form two opinions about which pages are strandable.

**A new read endpoint, `GET /api/pages?site=`**, is a thin transport over it — the shape
`/api/assets` and `/api/palette` already have. Read-only, with no write beside it: §4 stands,
and nothing here adds a navigation entry, removes one, or offers to. A request naming no site
is refused with a 400 naming `site`, like its neighbours, and it joins the origin's
no-store-coverage and `site`-not-`slug` wire contracts.

**The control moves the document, it does not re-derive the pane.** The pane composes its URL
from what the *outgoing* document held ([[REQ-215]]), so asking it to re-derive would compose
the page being left. Choosing a page points the displayed frame at the new one — which is
exactly what following a link inside the render does — and everything downstream follows the
arrival through machinery that already handles that: the carry adopts the new page, the idle
channel is re-pointed at it behind the visible one, and the control reads it back.

**The pane says where it is going; the document says where it is.** Navigation is not
instant, so for as long as it takes, the frame still holds the page being left. The control
names the page it was asked for until a document arrives, and the document takes the answer
back the instant there is one — otherwise choosing a page would answer the operator with the
page they just chose to leave and correct itself a moment later.

**The listing is re-taken on every document the pane shows**, which is what makes §5.6 true
without a reload: the assistant's write reloads the render, and the listing is read with it.
A failed listing keeps the last answer rather than emptying the control.

## 8. Further acceptance criteria

10. A page the home page cannot reach, directly or through other pages, is marked; the home
    page itself never is.
11. A page named only by a `navigation` entry is reachable.
12. A link is followed to the page the renderer would serve for it, and a link to another
    host reaches nothing of ours.
13. The listing states each page's reach per row, and reaches the builder over the wire; a
    request naming no site is refused.
14. Choosing a page names it immediately and keeps naming it until the page arrives.
15. The control sits in the same position in View and in Edit, so flipping channel does not
    move it out from under the pointer that just used it.