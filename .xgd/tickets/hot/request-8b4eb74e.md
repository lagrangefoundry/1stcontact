---
uid: request-8b4eb74e
id: REQ-349
type: request
title: Nothing detects an element that paints text and has been given no type, colour
  or padding — unstyled form controls ship looking broken and no tool says so
created_by: xgd
created_at: '2026-09-29T04:28:10.485709+00:00'
updated_at: '2026-09-29T04:28:10.485709+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What I was trying to achieve

Review a page for anything that would make it look unprofessional, and catch it before the client does.

## What stopped me

There is no way to ask "is anything on this page unstyled?" I can read any element and see that it carries no formatting, but only if I already suspect that element. Nothing surfaces it. `describe_page` gives me each element's address and a short label; `get_l1` gives me one element in full. Neither says *this element paints text and nobody told it how*.

So I completed a full design review of a page — hierarchy, palette, type, structure, copy, metadata, accessibility — and missed that all four input fields on it carried **only** a 1px border and a corner radius. No font, no size, no text colour, no placeholder colour, no padding. The browser was therefore drawing their placeholder text in its own default: near-black, hard against the left edge, in a face that had nothing to do with the page. The submit buttons beside them were fully specified. Someone had styled the buttons and never styled the inputs.

The client spotted it. I had looked at a picture of that section and had read the form's container twice while fixing its geometry, and I still missed it, because I was reading the form as a box and never opened it.

## Why this matters more than it looks

This is the single most valuable audit the product could add, for one reason: **it is invisible to exactly the person who most needs it caught.** A novice client will not say "the placeholder colour is unstyled". They will feel the page is slightly cheap and be unable to tell you why — and they will conclude the tool is cheap.

And unlike almost everything else in a design review, it is **decidable**. It needs no taste. It is a mechanical property of the element.

## The sharp version of the rule

"Unstyled" on its own is too blunt — a text element with no colour is usually *fine*, because it inherits the page's own default text colour, and that is a legitimate and common way to write a page. Flagging those would be noise, and an audit that cries wolf gets ignored.

The distinction that makes this precise:

> **What does this element fall back to when it is given nothing — the page, or the browser?**

- A **text** element with no colour falls back to the page's declared default text colour. Fine. Not a finding.
- A **control** with no font, no text colour, no placeholder colour and no padding falls back to *the user agent's* defaults, which have no relationship to the page at all. Always a finding.

Controls are the case where absence of styling is never inheritance and always an omission. That is a rule with no judgement in it.

Worth flagging, in rough priority:

1. A control with no `placeholderColor` — the specific defect here, and the most visible.
2. A control with no padding — text jammed against the border.
3. A control with no `fontFamily` / `fontSizePx` while sibling controls in the same component have them.
4. Any element carrying hardcoded hex colours where the rest of the page uses palette references — a strong signal that something was written by a process that did not know about the site's palette.
5. Sibling inconsistency generally: one control in a form styled, another not.

That last pair would have caught a second problem on the same page independently.

## Where I think it should live, and why

You asked where. My view, and I hold it fairly strongly:

**As a flag on `describe_page`'s entries — not as a separate audit tool.**

The reason is the failure mode itself. What went wrong was not that I looked and misjudged; it was that **I did not think to look**. A separate `audit_page` operation is something I would have to remember to call, and anything I have to remember to call will be forgotten in precisely the sessions that are busy enough to need it. `describe_page` is already the first thing called on any page and is called again after every change, because addresses regenerate. A flag there is free, is unmissable, and arrives at the moment the page is being oriented on rather than at the end.

Concretely: alongside each entry's label, a short marker — `unstyled: placeholder, padding` or similar — and a count in the page-level summary so that "3 elements need attention" is visible even when the entry list is long.

**Why not validation at write time.** Refusing to write an unstyled control would be wrong: a page under construction passes through unstyled states legitimately, and a refusal that has to be worked around trains people to work around refusals. A report is right; a gate is not.

**Why not only in the picture-taking tools.** They are the most expensive things available and are used sparingly and deliberately. An audit that only fires when someone takes a photograph fires least often on the sites being built fastest.

## Related, possibly the same ticket

A second, cheaper check with the same shape and the same argument for living in the same place: **an element that paints text and has been given a colour, where that colour has insufficient contrast against what it actually sits on.** Also decidable, also invisible to a novice, and the page background is already known to whatever renders the page.
