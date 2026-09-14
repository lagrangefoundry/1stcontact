---
uid: request-10200dc8
id: REQ-248
type: request
title: Every page is reachable from the control bar, and an unlinked one says so
created_by: EPIC-10
created_at: '2026-09-14T21:35:41.787381+00:00'
updated_at: '2026-09-14T22:13:41.784017+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-209f66e9
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