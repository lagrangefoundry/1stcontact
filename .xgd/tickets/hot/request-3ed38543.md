---
uid: request-3ed38543
id: REQ-391
type: request
title: 'Alternative looks: labelled sets of a page, browsed in a preview carousel
  with an animated swap and one-click choose'
created_by: EPIC-19
created_at: '2026-10-04T23:28:45.706501+00:00'
updated_at: '2026-10-04T23:28:45.706501+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5372f631
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

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- Creating a set yields labelled alternatives that are absent from the page list.
- The carousel shows label and n-of-N, and the arrows move between alternatives.
- "Choose this one" replaces the target page's content, records the decision and archives the rest.
- The comp viewer uses the same carousel.
- No client-facing string contains "unreachable".